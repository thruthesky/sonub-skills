#!/usr/bin/env perl
# agents-db.pl — cowork 의 AI 목록 `.cowork/.cowork-agents.json` 을 읽고 쓰는 유일한 곳.
#
#   cowork.sh 가 부른다. 사람이 직접 부를 일은 없다(보기·메모는 cowork.sh agents · note 로).
#
#   agents-db.pl <json> merge <scan.tsv>          init 의 스캔 결과를 합친다(사람이 고친 값·기록은 보존)
#   agents-db.pl <json> plan [<only>]             이번 실행에 돌릴 AI 와 건너뛸 AI(이유)를 TSV 로
#   agents-db.pl <json> record <id> <phase> <task> <exit> <diag> <secs> <model> [<log>]
#                                                  실행 결과를 기록하고 다음 실행에 쓸 것을 배운다
#   agents-db.pl <json> note <id> <text>          사람·오케스트레이터의 메모(원인·해결)를 남긴다
#   agents-db.pl <json> set <id> <key>=<value>…   enabled·model·modelPinned·timeout·fallbackModels·command
#   agents-db.pl <json> add-custom <id> <cmd-json> [<model>]  어댑터가 없는 CLI 를 직접 더한다
#   agents-db.pl <json> customs                   custom 에이전트 목록(id \t command JSON)
#   agents-db.pl <json> show                      사람이 읽는 표
#   agents-db.pl <json> brief <id,…>              실행 전 요약(최근 실패·메모)
#
# 🛑 JSON 을 쓰는 곳은 이 파일 하나뿐이다. 분석 러너는 백그라운드로 동시에 끝나므로 쓰기마다 flock 을
#    잡는다 — 잠금 없이 두 러너가 동시에 쓰면 한쪽 기록이 통째로 사라진다.
# 🛑 macOS 기본 perl 의 코어 모듈(JSON::PP·Fcntl·Time::Local·POSIX)만 쓴다 — jq·python·node 가 없어도 돈다.
use strict;
use warnings;
use utf8;   # 한글 리터럴을 문자열로 — JSON 에서 꺼낸 값과 섞어도 깨지지 않게
binmode STDERR, ":encoding(UTF-8)";
use JSON::PP;
use Fcntl qw(:flock);
use POSIX qw(strftime floor);
use Time::Local qw(timelocal);

my $FAIL_KEEP  = 20;   # AI 마다 남길 실패 기록 수
my $NOTE_KEEP  = 30;   # AI 마다 남길 메모 수
my $COOLDOWN   = ($ENV{COWORK_LIMIT_COOLDOWN_MIN} // 180) * 60;   # 한도 초과 뒤 쉬는 시간
my $T_BASE     = 900;                                              # 기본 제한 시간(cowork.sh 와 같다)
my $T_MAX      = $ENV{COWORK_TIMEOUT_MAX} // 2400;                # 늘려도 이 이상은 안 간다

my ($file, $cmd, @args) = @ARGV;
die "사용: agents-db.pl <json> <명령> …\n" unless $file && $cmd;

my $J = JSON::PP->new->utf8->pretty->canonical;

sub now_iso { strftime('%Y-%m-%dT%H:%M:%S%z', localtime(shift // time)) }
sub iso_epoch {
  my $s = shift // return 0;
  return 0 unless $s =~ /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)/;
  return timelocal($6, $5, $4, $3, $2 - 1, $1);
}
sub lastn { my ($r, $n) = @_; my @a = @{ $r || [] }; @a > $n ? @a[$#a - $n + 1 .. $#a] : @a }   # 끝에서 n 개
sub hhmm { strftime('%m-%d %H:%M', localtime(shift)) }
sub u8 { my $s = shift; utf8::decode($s) unless utf8::is_utf8($s); $s }   # 인자(바이트) → 문자열
sub out { my $s = join('', @_); utf8::encode($s) if utf8::is_utf8($s); print $s }

# 잠금 → 읽기 → 고치기 → 임시 파일에 쓰고 rename. 고칠 일이 없는 명령도 같은 잠금으로 읽는다
# (쓰는 도중의 반쯤 쓴 파일을 읽지 않게).
sub with_db {
  my ($write, $fn) = @_;
  open my $lk, '>>', "$file.lock" or die "잠금 파일을 열 수 없다: $file.lock\n";
  flock($lk, LOCK_EX) or die "잠금 실패\n";
  my $db = { version => 1, agents => {}, candidates => {} };
  if (-s $file) {
    open my $in, '<', $file or die "읽기 실패: $file\n";
    local $/; my $raw = <$in>; close $in;
    my $d = eval { $J->decode($raw) };
    if ($d && ref $d eq 'HASH') { $db = $d }
    else {   # 깨진 파일은 지우지 않고 옆에 남긴 뒤 새로 시작한다(사람이 고친 기록을 잃지 않게)
      rename $file, "$file.broken-" . time;
      print STDERR "⚠️  .cowork-agents.json 이 깨져 있어 옆에 남기고 새로 만든다.\n";
    }
  }
  $db->{agents} ||= {}; $db->{candidates} ||= {};
  my $ret = $fn->($db);
  if ($write) {
    $db->{updatedAt} = now_iso();
    my $tmp = "$file.tmp.$$";
    open my $o, '>', $tmp or die "쓰기 실패: $tmp\n";
    print {$o} $J->encode($db); close $o;
    rename $tmp, $file or die "rename 실패: $file\n";
  }
  close $lk;
  return $ret;
}

sub new_agent {
  my %a = @_;
  return {
    cli => $a{cli}, enabled => JSON::PP::true, available => JSON::PP::false,
    status => 'unknown', statusDetail => '', model => '', modelPinned => JSON::PP::false,
    effort => '', timeout => undef, fallbackModels => [], lastGoodModel => undef,
    cooldownUntil => undef, notes => [], failures => [],
    stats => { runs => 0, ok => 0, fail => 0, consecutiveFails => 0, lastOkAt => undef, lastFailAt => undef, avgSecs => undef },
  };
}

# 로그 끝부분 — ANSI 색·빈 줄을 걷고, 키·토큰처럼 보이는 값은 가린다(이 파일은 저장소에 커밋될 수 있다).
sub log_tail {
  my $f = shift // return '';
  return '' unless -f $f;
  open my $in, '<', $f or return '';
  my @l = grep { /\S/ } map { s/\e\[[0-9;?]*[A-Za-z]//gr =~ s/\r//gr } <$in>;
  close $in;
  my $t = join('', @l[($#l > 7 ? $#l - 7 : 0) .. $#l]);
  $t = u8($t);
  $t =~ s/\b(sk|pk|rk|ghp|gho|ghs|github_pat|xai|AIza|ya29)[-_A-Za-z0-9]{12,}/$1…[가림]/g;
  $t =~ s/(Bearer\s+)\S+/$1…[가림]/gi;
  $t =~ s/((?:api[_-]?key|token|secret|password)["']?\s*[:=]\s*["']?)[^\s"',]{6,}/$1…[가림]/gi;
  $t = substr($t, -800) if length $t > 800;
  $t =~ s/^\s+|\s+$//g;
  return $t;
}

my %CMD;

# --- merge: init 스캔 결과 합치기 ---------------------------------------------
# scan.tsv 한 줄 = agent \t id \t cli \t path \t version \t model \t effort \t status \t detail \t readonly
#                  \t probe(ok|fail|skip) \t probeSecs \t probeDiag \t probeLog \t readonlyCheck(ok|unsafe|-)
#               또는 candidate \t name \t path \t version
# 보존: enabled·timeout·notes·failures·stats·lastGoodModel·fallbackModels·command·modelPinned(+model)
$CMD{merge} = sub {
  my $scan = shift or die "merge: scan.tsv 가 필요하다\n";
  open my $in, '<', $scan or die "scan.tsv 를 열 수 없다: $scan\n";
  my @rows = map { chomp; [map { u8($_) } split /\t/, $_, -1] } grep { /\S/ } <$in>;
  close $in;
  with_db(1, sub {
    my $db = shift;
    my $now = now_iso();
    $db->{scannedAt} = $now;
    $db->{host} = u8($ENV{COWORK_HOST} // '');
    $db->{sandbox} = u8($ENV{COWORK_SANDBOX} // '');
    $db->{candidates} = {};
    for my $r (@rows) {
      my $kind = shift @$r;
      if ($kind eq 'candidate') {
        my ($name, $path, $ver) = @$r;
        $db->{candidates}{$name} = { path => $path, version => $ver,
          note => '어댑터 없음 — 읽기 전용 실행 방법을 확인한 뒤 `cowork.sh add-custom` 으로 더한다' };
        next;
      }
      my ($id, $cli, $path, $ver, $model, $effort, $status, $detail, $ro, $probe, $psecs, $pdiag, $plog, $rocheck) = @$r;
      my $a = $db->{agents}{$id} ||= new_agent(cli => $cli);
      my $prev_status = $a->{status} // '';
      my $prev_ver = $a->{version} // '';
      @$a{qw(cli path version readonly)} = ($cli, $path, $ver, $ro);
      $a->{model} = $model unless $a->{modelPinned};
      $a->{effort} = $effort if defined $effort && length $effort && !$a->{effortPinned};
      $a->{probe} = { at => $now, result => $probe, secs => ($psecs =~ /^\d+$/ ? $psecs + 0 : undef), diag => $pdiag };
      if ($status eq 'missing' || $status eq 'no-sandbox') {
        @$a{qw(status statusDetail available)} = ($status, $detail, JSON::PP::false);
      } elsif ($probe eq 'ok') {
        @$a{qw(status statusDetail available)} = ('ok', $detail, JSON::PP::true);
        $a->{cooldownUntil} = undef;
      } elsif ($probe eq 'fail') {
        my %st = ('인증 필요' => 'auth-failed', '구독·결제 문제' => 'subscription', '사용량 한도 초과' => 'limited');
        my $s = $st{$pdiag} // 'probe-failed';
        @$a{qw(status statusDetail available)} = ($s, $pdiag || $detail, JSON::PP::false);
        $a->{cooldownUntil} = now_iso(time + (log_tail($plog) =~ /monthly|weekly|billing cycle|this month/i ? 86400 : $COOLDOWN)) if $s eq 'limited';
        push @{ $a->{failures} }, { at => $now, phase => 'probe', task => 'init', exit => undef,
          diag => $pdiag || '확인 질문에 답하지 않음', secs => $a->{probe}{secs}, model => $model, log => log_tail($plog) };
        splice @{ $a->{failures} }, 0, @{ $a->{failures} } - $FAIL_KEEP if @{ $a->{failures} } > $FAIL_KEEP;
      } else {   # skip(빠른 스캔): 증거 없이 되살리지 않는다 — 같은 버전에서 막혔던 것은 그대로 둔다
        if ($prev_ver eq $ver && $prev_status =~ /^(auth-failed|subscription|probe-failed|unsafe|limited)$/) {
          # 그대로
        } else {
          @$a{qw(status statusDetail available)} = ('installed', '확인 질문 생략(빠른 스캔)', JSON::PP::true);
        }
      }
      if ($rocheck eq 'unsafe') {
        @$a{qw(status statusDetail available enabled)} = ('unsafe', '읽기 전용 공격 실측에서 파일이 만들어졌다', JSON::PP::false, JSON::PP::false);
      } elsif ($rocheck eq 'ok') {
        $a->{readonlyVerifiedAt} = $now;
      }
      $a->{fallbackModels} = ['gpt-5.6-terra'] if $cli eq 'codex' && !@{ $a->{fallbackModels} || [] } && !$a->{fallbackSeeded}++;
    }
    return;
  });
  return 0;
};

# --- plan: 이번 실행에 돌릴 AI ------------------------------------------------
# 출력(칸 구분 \x1f — 빈 칸이 있어도 bash read 가 밀리지 않게): run|skip · id · cli · model · effort · timeout · lastGoodModel · fallbackModels(,) · 이유
# <only> 를 주면(쉼표 목록) 그 AI 만 — 사람이 직접 고른 것이라 한도 쉬는 시간·사용 안 함은 무시하고 돌린다.
# 설치가 안 됐거나(missing) 가둘 수 없거나(no-sandbox) 공격 실측에서 뚫린(unsafe) 것은 고른 것이어도 돌리지 않는다.
$CMD{plan} = sub {
  my $only = shift // '';
  my %want = map { $_ => 1 } grep { length } split /,/, $only;
  my $rows = with_db(0, sub {
    my $db = shift; my @o;
    my %seen;
    for my $id (sort keys %{ $db->{agents} }) {
      my $a = $db->{agents}{$id};
      next if %want && !$want{$id};
      $seen{$id} = 1;
      my ($run, $why) = (1, '');
      my $cd = iso_epoch($a->{cooldownUntil});
      if (($a->{status} // '') =~ /^(missing|no-sandbox|unsafe)$/) { ($run, $why) = (0, "$a->{status} — $a->{statusDetail}") }
      elsif (!%want && !$a->{enabled}) { ($run, $why) = (0, '사용 안 함(enabled=false)') }
      elsif (!%want && !$a->{available}) { ($run, $why) = (0, "$a->{status} — " . ($a->{statusDetail} || '')) }
      elsif (!%want && $cd > time) { ($run, $why) = (0, '사용량 한도 — ' . hhmm($cd) . ' 까지 쉼') }
      push @o, join("\x1f", ($run ? 'run' : 'skip'), $id, $a->{cli} // '', $a->{model} // '', $a->{effort} // '',
        $a->{timeout} // '', $a->{lastGoodModel} // '', join(',', @{ $a->{fallbackModels} || [] }), $why);
    }
    for my $id (sort keys %want) { push @o, join("\x1f", 'skip', $id, '', '', '', '', '', '', '목록에 없는 AI — cowork.sh init 으로 스캔') unless $seen{$id} }
    return \@o;
  });
  out(map { "$_\n" } @$rows);
  return 0;
};

# --- record: 실행 결과 기록 + 학습 --------------------------------------------
# 성공: 통계·마지막 성공 모델을 남기고 연속 실패·쉬는 시간을 지운다.
# 실패: 기록을 쌓고, 원인별로 다음 실행을 바꾼다 —
#   인증 필요 / 구독·결제 문제 → available=false (사람이 로그인·결제한 뒤 init 이 되살린다)
#   사용량 한도 초과            → cooldownUntil (그때까지 자동으로 건너뛴다)
#   제한 시간 초과              → 이 AI 의 timeout 을 1.5배(최대 COWORK_TIMEOUT_MAX)
#   모델·추론 등급 거절         → 러너가 lastGoodModel·fallbackModels 로 한 번 다시 시도한다(여기선 기록만)
# 배운 것은 stdout 한 줄로 알린다(cowork.sh 가 화면에 보여 준다).
$CMD{record} = sub {
  my ($id, $phase, $task, $exit, $diag, $secs, $model, $log) = map { u8($_ // '') } @_;
  die "record: id 가 필요하다\n" unless length $id;
  my $msg = with_db(1, sub {
    my $db = shift;
    my $a = $db->{agents}{$id} ||= new_agent(cli => $id);
    my $s = $a->{stats} ||= {};
    my $now = now_iso();
    $s->{runs}++;
    my $learn = '';
    if ($exit eq '0') {
      $s->{ok}++; $s->{consecutiveFails} = 0; $s->{lastOkAt} = $now;
      $s->{avgSecs} = defined $s->{avgSecs} ? floor(($s->{avgSecs} * 3 + $secs) / 4) : $secs + 0 if $secs =~ /^\d+$/;
      $a->{lastGoodModel} = $model if length $model;
      $a->{cooldownUntil} = undef;
      if (($a->{status} // '') =~ /^(installed|probe-failed|limited|unknown)$/) { @$a{qw(status statusDetail available)} = ('ok', '', JSON::PP::true) }
    } else {
      $s->{fail}++; $s->{consecutiveFails}++; $s->{lastFailAt} = $now;
      push @{ $a->{failures} }, { at => $now, phase => $phase, task => $task, exit => ($exit =~ /^\d+$/ ? $exit + 0 : $exit),
        diag => $diag || '기타', secs => ($secs =~ /^\d+$/ ? $secs + 0 : undef), model => $model, log => log_tail($log) };
      splice @{ $a->{failures} }, 0, @{ $a->{failures} } - $FAIL_KEEP if @{ $a->{failures} } > $FAIL_KEEP;
      if ($diag eq 'CLI 미설치' || $diag eq '샌드박스 없음') {
        @$a{qw(status statusDetail available)} = ($diag eq 'CLI 미설치' ? 'missing' : 'no-sandbox', $diag, JSON::PP::false);
        $learn = "다음부터 건너뜀($diag) — 설치한 뒤 cowork.sh init";
      } elsif ($diag eq '인증 필요' || $diag eq '구독·결제 문제') {
        @$a{qw(status statusDetail available)} = ($diag eq '인증 필요' ? 'auth-failed' : 'subscription', $diag, JSON::PP::false);
        $learn = "다음부터 건너뜀($diag) — 사람이 로그인·결제를 고친 뒤 cowork.sh init 으로 되살린다";
      } elsif ($diag eq '사용량 한도 초과') {
        # 월·주 단위 한도(copilot "monthly quota", 예전 kimi "billing cycle")는 몇 시간 쉬어도 안 풀린다 → 하루
        my $cd = log_tail($log) =~ /monthly|weekly|billing cycle|this month/i ? 86400 : $COOLDOWN;
        $a->{cooldownUntil} = now_iso(time + $cd);
        $learn = '사용량 한도 — ' . hhmm(time + $cd) . ' 까지 자동으로 건너뜀';
      } elsif ($diag =~ /^제한 시간 초과/) {
        # 이번에 실제로 기다린 시간(secs)을 기준으로 1.5배. 사람이 COWORK_TIMEOUT 으로 지금 값보다 짧게 준
        # 실행(시험 등)이 끊긴 것은 배우지 않는다 — 그대로 배우면 다음 실행의 제한이 오히려 짧아진다.
        my $cur = $a->{timeout} || $T_BASE;
        my $used = $secs =~ /^\d+$/ ? $secs : $cur;
        if ($used < $cur * 0.9) { $learn = "사람이 준 짧은 제한(${used}s)에서 끊김 — 제한 시간은 그대로 ${cur}s" }
        else {
          my $nt = floor($used * 1.5); $nt = $T_MAX if $nt > $T_MAX;
          if ($nt > $cur) { $a->{timeout} = $nt; $learn = "제한 시간을 ${cur}s → ${nt}s 로 늘림" }
          else { $learn = "이미 최대 제한 시간(${T_MAX}s) — 요청 범위를 나누거나 COWORK_TIMEOUT_MAX 를 올린다" }
        }
      } elsif ($diag eq '모델·추론 등급 거절') {
        $learn = '모델 거절 — 마지막 성공 모델 ' . ($a->{lastGoodModel} // '(없음)') . ' 로 다음에도 다시 시도한다';
      }
      $learn .= ($learn ? ' · ' : '') . "연속 실패 $s->{consecutiveFails}번 — 원인을 확인해 cowork.sh note $id \"…\" 로 남겨라"
        if $s->{consecutiveFails} >= 3;
    }
    return $learn;
  });
  out("$msg\n") if length $msg;
  return 0;
};

$CMD{note} = sub {
  my ($id, @text) = @_;
  my $t = u8(join ' ', @text);
  die "note: id 와 내용이 필요하다\n" unless $id && length $t;
  with_db(1, sub {
    my $db = shift;
    my $a = $db->{agents}{$id} or die "목록에 없는 AI: $id\n";
    push @{ $a->{notes} }, { at => now_iso(), text => $t };
    splice @{ $a->{notes} }, 0, @{ $a->{notes} } - $NOTE_KEEP if @{ $a->{notes} } > $NOTE_KEEP;
  });
  out("📝 $id 메모를 남겼다.\n");
  return 0;
};

$CMD{set} = sub {
  my ($id, @kv) = @_;
  die "set: id 와 key=value 가 필요하다\n" unless $id && @kv;
  with_db(1, sub {
    my $db = shift;
    my $a = $db->{agents}{$id} or die "목록에 없는 AI: $id\n";
    for (@kv) {
      my ($k, $v) = split /=/, u8($_), 2;
      die "형식: key=value ($_)\n" unless defined $v;
      if ($k =~ /^(enabled|modelPinned|effortPinned|available)$/) { $a->{$k} = $v =~ /^(1|true|yes|on)$/i ? JSON::PP::true : JSON::PP::false }
      elsif ($k eq 'timeout') { $a->{timeout} = length $v ? $v + 0 : undef }
      elsif ($k eq 'fallbackModels') { $a->{fallbackModels} = [grep { length } split /,/, $v] }
      elsif ($k eq 'command') { $a->{command} = $J->decode($v) }
      elsif ($k =~ /^(model|effort|status|statusDetail)$/) { $a->{$k} = $v }
      elsif ($k eq 'cooldownUntil') { $a->{cooldownUntil} = length $v ? $v : undef }
      else { die "바꿀 수 없는 항목: $k\n" }
    }
    if (defined $a->{available} && $a->{available} && ($a->{status} // '') =~ /^(auth-failed|subscription|probe-failed|limited)$/) {
      $a->{status} = 'installed'; $a->{statusDetail} = '사람이 직접 되살림';
    }
  });
  out("✅ $id 를 고쳤다.\n");
  return 0;
};

$CMD{'add-custom'} = sub {
  my ($id, $cmdjson, $model) = @_;
  die "add-custom: <id> <명령 JSON 배열> [<모델>]\n" unless $id && $cmdjson;
  die "id 는 소문자·숫자·하이픈만: $id\n" unless $id =~ /^[a-z0-9][a-z0-9-]*$/;
  my $c = eval { $J->decode($cmdjson) };
  die "명령은 JSON 배열이어야 한다. 예: [\"mycli\",\"-p\",\"{PROMPT}\"]\n" unless ref $c eq 'ARRAY' && @$c;
  die "명령에 {PROMPT} 또는 {PROMPT_FILE} 자리가 있어야 한다\n" unless grep { /\{PROMPT(_FILE)?\}/ } @$c;
  with_db(1, sub {
    my $db = shift;
    my $a = $db->{agents}{$id} ||= new_agent(cli => 'custom');
    $a->{cli} = 'custom'; $a->{command} = $c; $a->{model} = u8($model // '');
    $a->{readonly} = 'sandbox-exec (OS 가 작업공간 쓰기를 막는다 — 없으면 실행하지 않는다)';
    @$a{qw(status statusDetail available)} = ('installed', 'custom — init 으로 확인 질문을 해 보라', JSON::PP::true);
  });
  out("✅ custom AI $id 를 더했다. `cowork.sh init --verify` 로 답하는지·읽기 전용인지 확인하라.\n");
  return 0;
};

$CMD{customs} = sub {
  my $rows = with_db(0, sub {
    my $db = shift;
    [map { my $a = $db->{agents}{$_}; join("\t", $_, JSON::PP->new->utf8->canonical->encode($a->{command} || []), $a->{model} // '') }
      grep { ($db->{agents}{$_}{cli} // '') eq 'custom' } sort keys %{ $db->{agents} }];
  });
  out(map { "$_\n" } @$rows);
  return 0;
};

my %ST = (ok => '✅ 사용 가능', installed => '🟡 설치됨(미확인)', missing => '⬜ 미설치', 'no-sandbox' => '⛔ 샌드박스 없음',
  'auth-failed' => '🔑 로그인 필요', subscription => '💳 구독·결제 문제', limited => '⏳ 사용량 한도', 'probe-failed' => '❌ 응답 없음',
  unsafe => '🚨 읽기 전용 실패', unknown => '❔');

$CMD{show} = sub {
  my $txt = with_db(0, sub {
    my $db = shift;
    my @o = ("cowork AI 목록 — " . ($db->{scannedAt} ? "스캔 $db->{scannedAt}" : '스캔 안 함') . "\n");
    for my $id (sort keys %{ $db->{agents} }) {
      my $a = $db->{agents}{$id}; my $s = $a->{stats} || {};
      my $st = $ST{$a->{status} // 'unknown'} // $a->{status};
      $st .= ' · 사용 안 함' unless $a->{enabled};
      my $cd = iso_epoch($a->{cooldownUntil}); $st .= ' · ' . hhmm($cd) . ' 까지 쉼' if $cd > time;
      push @o, sprintf("\n  %s  %s  (%s · %s)\n", $st, $id, $a->{cli} // '', $a->{version} // '');
      push @o, sprintf("      모델 %s%s · 등급 %s · 제한 %s · 실행 %d(성공 %d·실패 %d)%s\n",
        length($a->{model} // '') ? $a->{model} : '(자동·CLI 기본)', $a->{modelPinned} ? '[고정]' : '',
        length($a->{effort} // '') ? $a->{effort} : '-', ($a->{timeout} ? "$a->{timeout}s" : "기본"),
        $s->{runs} // 0, $s->{ok} // 0, $s->{fail} // 0, defined $s->{avgSecs} ? " · 평균 $s->{avgSecs}s" : '');
      push @o, "      상태: $a->{statusDetail}\n" if length($a->{statusDetail} // '') && ($a->{status} // '') ne 'ok';
      if (my $f = ($a->{failures} || [])->[-1]) { push @o, "      최근 실패: $f->{at} · $f->{phase}/$f->{task} · $f->{diag}\n" }
      for my $n (lastn($a->{notes}, 3)) { push @o, "      메모: $n->{text}\n" }
    }
    if (%{ $db->{candidates} }) {
      push @o, "\n  어댑터 없는 AI CLI(설치는 됨): " . join(', ', sort keys %{ $db->{candidates} }) . "\n";
      push @o, "      → 읽기 전용 실행 방법을 확인한 뒤 cowork.sh add-custom <id> '[\"cli\",\"-p\",\"{PROMPT}\"]'\n";
    }
    return join '', @o;
  });
  out($txt);
  return 0;
};

# 실행 전 요약 — 이번에 돌릴 AI 의 최근 실패(7일 안)와 메모. 오케스트레이터가 알림에서 같이 읽는다.
$CMD{brief} = sub {
  my %ids = map { $_ => 1 } split /,/, shift // '';
  my $txt = with_db(0, sub {
    my $db = shift; my @o;
    for my $id (sort keys %ids) {
      my $a = $db->{agents}{$id} or next;
      my @recent = grep { iso_epoch($_->{at}) > time - 7 * 86400 && $_->{phase} ne 'probe' } @{ $a->{failures} || [] };
      push @o, sprintf("   · %s: 최근 7일 실패 %d번 (마지막: %s)\n", $id, scalar @recent, $recent[-1]{diag}) if @recent;
      push @o, "   · $id 메모: $_->{text}\n" for lastn($a->{notes}, 2);
    }
    return join '', @o;
  });
  out($txt);
  return 0;
};

my $fn = $CMD{$cmd} or die "모르는 명령: $cmd\n";
exit($fn->(@args));
