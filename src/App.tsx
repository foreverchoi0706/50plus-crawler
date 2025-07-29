import { ChangeEvent, FC, useState } from "react";
import styles from "./App.module.css";

/** 메시지 타입 */
const MESSAGE_TYPE = {
	START: "START", // 영역 선택 시작
	RESET: "RESET", // 영역 선택 초기화
	PING: "PING", // 컨텐츠 스크립트 확인
	LINK_EMPLOYMENT: "LINK_EMPLOYMENT", // 일자리 링크 이동
	LINK_LIFESTYLE: "LINK_LIFESTYLE", // 복지·건강 링크 이동
	LINK_OTHER: "LINK_OTHER", // 중장년 매거진 링크 이동
} as const;
/** 컨텐츠 타입 */
const CONTENT_TYPE = {
	EMPLOYMENT: "EMPLOYMENT", // 일자리
	LIFESTYLE: "LIFESTYLE", // 복지·건강
	OTHER: "OTHER", // 중장년 매거진
} as const;

const App: FC = () => {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [contentType, setContentType] = useState<keyof typeof CONTENT_TYPE>(
		CONTENT_TYPE.EMPLOYMENT,
	);

	const onContentTypeChange = (e: ChangeEvent<HTMLInputElement>) => {
		setContentType(e.target.value as keyof typeof CONTENT_TYPE);
	};

	const sendMessage = async (messageType: keyof typeof MESSAGE_TYPE) => {
		if (window.chrome === undefined || window.chrome.tabs === undefined)
			return setErrorMessage("크롬 확장 프로그램 환경에서만 동작합니다.");

		try {
			// 현재 활성화된 탭 가져오기
			const [tab] = await window.chrome.tabs.query({
				active: true,
				currentWindow: true,
			});
			if (tab.id === undefined) {
				return setErrorMessage("탭을 찾을 수 없습니다.");
			}

			if (tab.url && tab.url.startsWith("chrome://")) {
				return setErrorMessage(
					"Chrome 홈 및 설정 페이지에서는 사용할 수 없습니다. 일반 웹페이지에서 사용해주세요.",
				);
			}

			// content script가 이미 로드되어 있는지 확인
			try {
				await window.chrome.tabs.sendMessage(tab.id, {
					type: MESSAGE_TYPE.PING,
				});
			} catch {
				// content script가 로드되어 있지 않으면 주입
				await window.chrome.scripting.executeScript({
					target: { tabId: tab.id },
					files: ["content.js"],
				});
			}

			// 메시지 전송
			await window.chrome.tabs.sendMessage(tab.id, {
				type: messageType,
				contentType,
			});
			setErrorMessage(null);
		} catch (err) {
			setErrorMessage(JSON.stringify(err));
			console.error(err);
		}
	};

	return (
		<main className={styles.main}>
			<div className={styles.title_wrap}>
				<img width={30} height={30} src="/icons/logo.png" alt="logo" />
				<h1>서울시50플러스포털 크롤러</h1>
			</div>
			<p>
				서울시50플러스포털크롤러는 서울시50플러스포털의 컨텐츠를 추출하는 확장
				프로그램입니다
			</p>
			<p>오류 및 문의사항은 비즈플랫폼 개발팀 최영원에게 문의 주세요</p>
			<fieldset className={styles.fields_wrap}>
				<label>
					<button
						type="button"
						onClick={() => sendMessage(MESSAGE_TYPE.LINK_EMPLOYMENT)}
					>
						일자리
					</button>
					<input
						type="radio"
						name="contentType"
						value={CONTENT_TYPE.EMPLOYMENT}
						checked={contentType === CONTENT_TYPE.EMPLOYMENT}
						onChange={onContentTypeChange}
					/>
				</label>
				<label>
					<button
						type="button"
						onClick={() => sendMessage(MESSAGE_TYPE.LINK_LIFESTYLE)}
					>
						복지·건강
					</button>
					<input
						type="radio"
						name="contentType"
						value={CONTENT_TYPE.LIFESTYLE}
						checked={contentType === CONTENT_TYPE.LIFESTYLE}
						onChange={onContentTypeChange}
					/>
				</label>
				<label>
					<button
						type="button"
						onClick={() => sendMessage(MESSAGE_TYPE.LINK_OTHER)}
					>
						중장년 매거진
					</button>
					<input
						type="radio"
						name="contentType"
						value={CONTENT_TYPE.OTHER}
						checked={contentType === CONTENT_TYPE.OTHER}
						onChange={onContentTypeChange}
					/>
				</label>
			</fieldset>
			<div className={styles.buttons_wrap}>
				<button
					onClick={() => sendMessage(MESSAGE_TYPE.START)}
					type="button"
					className={styles.start_button}
				>
					영역 선택 시작
				</button>
				<button
					onClick={() => sendMessage(MESSAGE_TYPE.RESET)}
					type="button"
					className={styles.reset_button}
				>
					초기화
				</button>
			</div>
			{errorMessage && <em className={styles.error_message}>{errorMessage}</em>}
		</main>
	);
};

export default App;
