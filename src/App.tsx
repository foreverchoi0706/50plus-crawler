import { ChangeEvent, FC, useState } from "react";
import styles from "./App.module.css";

/** 메시지 타입 */
const MESSAGE_TYPE = {
	START: "START", // 영역 선택 시작
	RESET: "RESET", // 영역 선택 초기화
	PING: "PING", // 컨텐츠 스크립트 확인
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
			if (tab.id === undefined)
				return setErrorMessage("탭을 찾을 수 없습니다.");

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
			setErrorMessage(
				"영역 선택을 시작할 수 없습니다. 페이지를 새로고침 후 다시 시도해주세요.",
			);
			console.error(err);
		}
	};

	return (
		<main className={styles.main}>
			<h1 className={styles.title}>서울시50플러스포털 크롤러</h1>
			<p>
				서울시50플러스포털크롤러는 서울시50플러스포털의 컨텐츠를 추출하는 확장
				프로그램입니다
			</p>
			<p>오류 및 문의사항은 비즈플랫폼 개발팀 최영원에게 문의 주세요</p>
			<fieldset className={styles.fields_wrap}>
				<label>
					<a
						title="일자리"
						href="https://50plus.or.kr/PolicyInfo_Job.do"
						target="_blank"
						rel="noopener noreferrer"
					>
						일자리
					</a>
					<input
						type="radio"
						name="contentType"
						value={CONTENT_TYPE.EMPLOYMENT}
						checked={contentType === CONTENT_TYPE.EMPLOYMENT}
						onChange={onContentTypeChange}
					/>
				</label>
				<label>
					<a
						title="복지·건강"
						href="https://50plus.or.kr/PolicyInfo_Welfare-Health.do"
						target="_blank"
						rel="noopener noreferrer"
					>
						복지·건강
					</a>
					<input
						type="radio"
						name="contentType"
						value={CONTENT_TYPE.LIFESTYLE}
						checked={contentType === CONTENT_TYPE.LIFESTYLE}
						onChange={onContentTypeChange}
					/>
				</label>
				<label>
					<a
						title="중장년 매거진"
						href="https://50plus.or.kr/Magazine.do"
						target="_blank"
						rel="noopener noreferrer"
					>
						중장년 매거진
					</a>
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
