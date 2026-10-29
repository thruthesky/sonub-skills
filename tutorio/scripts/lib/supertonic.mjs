// Supertonic 3 inference engine (text → speech) for Node — onnxruntime-node is passed in with useOrt().
// Source: supertone-inc/supertonic official web example helper.js (MIT, sample code), as used by sonub.com
// (public/js/voice/tts/engine.js). Model: HuggingFace Supertone/supertonic-3 (OpenRAIL-M — commercial use allowed).
// Keep the logic unchanged; narrate.mjs loads the model files and calls TextToSpeech.call().

let ort = null;

/** 워커가 불러 둔 onnxruntime-web 모듈을 엔진에 넘긴다 */
export function useOrt(module) {
	ort = module;
}

// Supertonic 3 이 지원하는 언어 코드(31개 + 언어 무관 'na')
export const AVAILABLE_LANGS = [
	'en', 'ko', 'ja', 'ar', 'bg', 'cs', 'da', 'de', 'el', 'es', 'et', 'fi',
	'fr', 'hi', 'hr', 'hu', 'id', 'it', 'lt', 'lv', 'nl', 'pl', 'pt', 'ro',
	'ru', 'sk', 'sl', 'sv', 'tr', 'uk', 'vi', 'na'
];

export function isValidLang(lang) {
	return AVAILABLE_LANGS.includes(lang);
}

/** 유니코드 기반 텍스트 전처리기 — g2p 없이 문자 코드포인트를 인덱스로 바꾼다(한국어 포함) */
export class UnicodeProcessor {
	constructor(indexer) {
		this.indexer = indexer;
	}

	call(textList, langList) {
		const processedTexts = textList.map((text, i) => this.preprocessText(text, langList[i]));
		const textIdsLengths = processedTexts.map((text) => text.length);
		const maxLen = Math.max(...textIdsLengths);

		const textIds = processedTexts.map((text) => {
			const row = new Array(maxLen).fill(0);
			for (let j = 0; j < text.length; j++) {
				const codePoint = text.codePointAt(j);
				row[j] = codePoint < this.indexer.length ? this.indexer[codePoint] : -1;
			}
			return row;
		});

		return { textIds, textMask: this.getTextMask(textIdsLengths) };
	}

	preprocessText(text, lang) {
		// 🛑 NFKD 가 반드시 필요하다 — 인덱서는 완성형 한글을 모르고 자모만 안다
		text = text.normalize('NFKD');

		// 이모지 제거
		const emojiPattern =
			/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]+/gu;
		text = text.replace(emojiPattern, '');

		// 각종 대시·기호 치환
		const replacements = {
			'–': '-', '‑': '-', '—': '-', '_': ' ',
			'“': '"', '”': '"', '‘': "'", '’': "'",
			'´': "'", '`': "'", '[': ' ', ']': ' ', '|': ' ', '/': ' ',
			'#': ' ', '→': ' ', '←': ' '
		};
		for (const [k, v] of Object.entries(replacements)) text = text.replaceAll(k, v);

		// 특수 기호 제거
		text = text.replace(/[♥☆♡©\\]/g, '');

		// 알려진 표현 치환
		const exprReplacements = { '@': ' at ', 'e.g.,': 'for example, ', 'i.e.,': 'that is, ' };
		for (const [k, v] of Object.entries(exprReplacements)) text = text.replaceAll(k, v);

		// 구두점 앞 공백 정리
		text = text.replace(/ ,/g, ',').replace(/ \./g, '.').replace(/ !/g, '!')
			.replace(/ \?/g, '?').replace(/ ;/g, ';').replace(/ :/g, ':').replace(/ '/g, "'");

		// 중복 따옴표 제거
		while (text.includes('""')) text = text.replace('""', '"');
		while (text.includes("''")) text = text.replace("''", "'");
		while (text.includes('``')) text = text.replace('``', '`');

		// 여분 공백 제거
		text = text.replace(/\s+/g, ' ').trim();

		// 끝이 구두점·따옴표·닫는 괄호가 아니면 마침표를 붙인다
		if (!/[.!?;:,'"')\]}…。」』】〉》›»]$/.test(text)) text += '.';

		if (!isValidLang(lang)) throw new Error(`Invalid language: ${lang}. Available: ${AVAILABLE_LANGS.join(', ')}`);

		// 언어 태그로 감싼다
		return `<${lang}>${text}</${lang}>`;
	}

	getTextMask(textIdsLengths) {
		return this.lengthToMask(textIdsLengths, Math.max(...textIdsLengths));
	}

	lengthToMask(lengths, maxLen = null) {
		const actualMaxLen = maxLen ?? Math.max(...lengths);
		return lengths.map((len) => {
			const row = new Array(actualMaxLen).fill(0.0);
			for (let j = 0; j < Math.min(len, actualMaxLen); j++) row[j] = 1.0;
			return [row];
		});
	}
}

/** TTL·DP 텐서를 담는 화자 스타일 */
export class Style {
	constructor(ttl, dp) {
		this.ttl = ttl;
		this.dp = dp;
	}
}

/** Text-to-Speech 추론기(ONNX 세션 4개) */
export class TextToSpeech {
	constructor(cfgs, textProcessor, dpOrt, textEncOrt, vectorEstOrt, vocoderOrt) {
		this.cfgs = cfgs;
		this.textProcessor = textProcessor;
		this.dpOrt = dpOrt;
		this.textEncOrt = textEncOrt;
		this.vectorEstOrt = vectorEstOrt;
		this.vocoderOrt = vocoderOrt;
		this.sampleRate = cfgs.ae.sample_rate;
	}

	async infer(textList, langList, style, totalStep, speed = 1.05) {
		const bsz = textList.length;
		const { textIds, textMask } = this.textProcessor.call(textList, langList);

		const textIdsTensor = new ort.Tensor('int64', new BigInt64Array(textIds.flat().map((x) => BigInt(x))), [bsz, textIds[0].length]);
		const textMaskTensor = new ort.Tensor('float32', new Float32Array(textMask.flat(2)), [bsz, 1, textMask[0][0].length]);

		// 길이 예측
		const dpOutputs = await this.dpOrt.run({ text_ids: textIdsTensor, style_dp: style.dp, text_mask: textMaskTensor });
		const duration = Array.from(dpOutputs.duration.data, Number);
		for (let i = 0; i < duration.length; i++) duration[i] /= speed;

		// 텍스트 인코딩
		const textEncOutputs = await this.textEncOrt.run({ text_ids: textIdsTensor, style_ttl: style.ttl, text_mask: textMaskTensor });
		const textEmb = textEncOutputs.text_emb;

		// 노이즈 잠재 샘플링
		let { xt, latentMask } = this.sampleNoisyLatent(
			duration,
			this.sampleRate,
			this.cfgs.ae.base_chunk_size,
			this.cfgs.ttl.chunk_compress_factor,
			this.cfgs.ttl.latent_dim
		);
		const latentMaskTensor = new ort.Tensor('float32', new Float32Array(latentMask.flat(2)), [bsz, 1, latentMask[0][0].length]);
		const totalStepTensor = new ort.Tensor('float32', new Float32Array(bsz).fill(totalStep), [bsz]);

		// 디노이징 루프
		for (let step = 0; step < totalStep; step++) {
			const currentStepTensor = new ort.Tensor('float32', new Float32Array(bsz).fill(step), [bsz]);
			const xtTensor = new ort.Tensor('float32', new Float32Array(xt.flat(2)), [bsz, xt[0].length, xt[0][0].length]);

			const vectorEstOutputs = await this.vectorEstOrt.run({
				noisy_latent: xtTensor,
				text_emb: textEmb,
				style_ttl: style.ttl,
				latent_mask: latentMaskTensor,
				text_mask: textMaskTensor,
				current_step: currentStepTensor,
				total_step: totalStepTensor
			});
			const denoised = Array.from(vectorEstOutputs.denoised_latent.data, Number);

			// 3차원으로 되돌린다
			const latentDim = xt[0].length;
			const latentLen = xt[0][0].length;
			xt = [];
			let idx = 0;
			for (let b = 0; b < bsz; b++) {
				const batch = [];
				for (let d = 0; d < latentDim; d++) {
					const row = [];
					for (let t = 0; t < latentLen; t++) row.push(denoised[idx++]);
					batch.push(row);
				}
				xt.push(batch);
			}
		}

		// 파형 생성
		const finalXtTensor = new ort.Tensor('float32', new Float32Array(xt.flat(2)), [bsz, xt[0].length, xt[0][0].length]);
		const vocoderOutputs = await this.vocoderOrt.run({ latent: finalXtTensor });
		const wav = Array.from(vocoderOutputs.wav_tts.data, Number);

		return { wav, duration };
	}

	/** 글을 청크로 나눠 차례로 합성하고, 청크 사이에 무음을 넣어 잇는다 */
	async call(text, lang, style, totalStep, speed = 1.05, silenceDuration = 0.3, chunks = { cjk: 120, other: 300 }) {
		if (style.ttl.dims[0] !== 1) throw new Error('Single speaker text to speech only supports single style');
		// 한국어·일본어는 문자당 정보량이 커서 청크를 짧게 잡는다
		const maxLen = lang === 'ko' || lang === 'ja' ? chunks.cjk : chunks.other;
		const textList = chunkText(text, maxLen);
		let wavCat = [];
		let durCat = 0;

		for (const chunk of textList) {
			const { wav, duration } = await this.infer([chunk], [lang], style, totalStep, speed);
			if (wavCat.length === 0) {
				wavCat = wav;
				durCat = duration[0];
			} else {
				const silenceLen = Math.floor(silenceDuration * this.sampleRate);
				wavCat = [...wavCat, ...new Array(silenceLen).fill(0), ...wav];
				durCat += duration[0] + silenceDuration;
			}
		}

		return { wav: wavCat, duration: [durCat] };
	}

	sampleNoisyLatent(duration, sampleRate, baseChunkSize, chunkCompress, latentDim) {
		const bsz = duration.length;
		const maxDur = Math.max(...duration);
		const wavLenMax = Math.floor(maxDur * sampleRate);
		const wavLengths = duration.map((d) => Math.floor(d * sampleRate));

		const chunkSize = baseChunkSize * chunkCompress;
		const latentLen = Math.floor((wavLenMax + chunkSize - 1) / chunkSize);
		const latentDimVal = latentDim * chunkCompress;

		const xt = [];
		for (let b = 0; b < bsz; b++) {
			const batch = [];
			for (let d = 0; d < latentDimVal; d++) {
				const row = [];
				for (let t = 0; t < latentLen; t++) {
					// Box-Muller 변환으로 표준정규 난수
					const u1 = Math.max(0.0001, Math.random());
					const u2 = Math.random();
					row.push(Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2));
				}
				batch.push(row);
			}
			xt.push(batch);
		}

		const latentLengths = wavLengths.map((len) => Math.floor((len + chunkSize - 1) / chunkSize));
		const latentMask = this.textProcessor.lengthToMask(latentLengths, latentLen);
		for (let b = 0; b < bsz; b++)
			for (let d = 0; d < latentDimVal; d++)
				for (let t = 0; t < latentLen; t++) xt[b][d][t] *= latentMask[b][0][t];

		return { xt, latentMask };
	}
}

/** 파싱한 화자 스타일 JSON 들로 Style 텐서를 만든다 */
export function styleFromJson(voiceStyles) {
	const bsz = voiceStyles.length;
	const first = voiceStyles[0];
	const [, ttlDim1, ttlDim2] = first.style_ttl.dims;
	const [, dpDim1, dpDim2] = first.style_dp.dims;

	const ttlFlat = new Float32Array(bsz * ttlDim1 * ttlDim2);
	const dpFlat = new Float32Array(bsz * dpDim1 * dpDim2);
	for (let i = 0; i < bsz; i++) {
		ttlFlat.set(voiceStyles[i].style_ttl.data.flat(Infinity), i * ttlDim1 * ttlDim2);
		dpFlat.set(voiceStyles[i].style_dp.data.flat(Infinity), i * dpDim1 * dpDim2);
	}

	return new Style(
		new ort.Tensor('float32', ttlFlat, [bsz, ttlDim1, ttlDim2]),
		new ort.Tensor('float32', dpFlat, [bsz, dpDim1, dpDim2])
	);
}

/** 글을 문단·문장 경계로 나눠 maxLen 이하 청크로 만든다 */
export function chunkText(text, maxLen = 300) {
	if (typeof text !== 'string') throw new Error(`chunkText expects a string, got ${typeof text}`);

	const paragraphs = text.trim().split(/\n\s*\n+/).filter((p) => p.trim());
	const chunks = [];
	for (let paragraph of paragraphs) {
		paragraph = paragraph.trim();
		if (!paragraph) continue;

		const sentences = paragraph.split(
			/(?<!Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Sr\.|Jr\.|Ph\.D\.|etc\.|e\.g\.|i\.e\.|vs\.|Inc\.|Ltd\.|Co\.|Corp\.|St\.|Ave\.|Blvd\.)(?<!\b[A-Z]\.)(?<=[.!?])\s+/
		);
		let currentChunk = '';
		for (const sentence of sentences) {
			if (currentChunk.length + sentence.length + 1 <= maxLen) {
				currentChunk += (currentChunk ? ' ' : '') + sentence;
			} else {
				if (currentChunk) chunks.push(currentChunk.trim());
				currentChunk = sentence;
			}
		}
		if (currentChunk) chunks.push(currentChunk.trim());
	}
	return chunks;
}

/** Float32 오디오 샘플을 16-bit PCM WAV(ArrayBuffer)로 */
export function writeWavFile(audioData, sampleRate) {
	const numChannels = 1;
	const bitsPerSample = 16;
	const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
	const blockAlign = (numChannels * bitsPerSample) / 8;
	const dataSize = audioData.length * 2;

	const buffer = new ArrayBuffer(44 + dataSize);
	const view = new DataView(buffer);
	const writeString = (offset, str) => {
		for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
	};

	writeString(0, 'RIFF');
	view.setUint32(4, 36 + dataSize, true);
	writeString(8, 'WAVE');
	writeString(12, 'fmt ');
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true); // PCM
	view.setUint16(22, numChannels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, byteRate, true);
	view.setUint16(32, blockAlign, true);
	view.setUint16(34, bitsPerSample, true);
	writeString(36, 'data');
	view.setUint32(40, dataSize, true);

	const int16Data = new Int16Array(audioData.length);
	for (let i = 0; i < audioData.length; i++) {
		const clamped = Math.max(-1.0, Math.min(1.0, audioData[i]));
		int16Data[i] = Math.floor(clamped * 32767);
	}
	new Uint8Array(buffer, 44).set(new Uint8Array(int16Data.buffer));
	return buffer;
}
