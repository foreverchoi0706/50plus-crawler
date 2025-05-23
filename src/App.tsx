import { useState } from "react";
import styles from "./App.module.css";

export const MESSAGE_TYPE = {
	START: "START",
	RESET: "RESET",
	PING: "PING",
} as const;

const App = () => {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const sendMessage = async (messageType: keyof typeof MESSAGE_TYPE) => {
		if (window.chrome === undefined || window.chrome.tabs === undefined)
			return setErrorMessage("크롬 확장 프로그램 환경에서만 동작합니다.");

		try {
			// 현재 활성화된 탭 가져오기
			const [tab] = await window.chrome.tabs.query({ active: true, currentWindow: true });
			if (tab.id === undefined) return setErrorMessage("탭을 찾을 수 없습니다.");

			// content script가 이미 로드되어 있는지 확인
			try {
				await window.chrome.tabs.sendMessage(tab.id, { type: MESSAGE_TYPE.PING });
			} catch {
				// content script가 로드되어 있지 않으면 주입
				await window.chrome.scripting.executeScript({
					target: { tabId: tab.id },
					files: ["content.js"],
				});
			}

			// 메시지 전송
			await window.chrome.tabs.sendMessage(tab.id, { type: messageType });
			setErrorMessage(null);
		} catch (err) {
			setErrorMessage("영역 선택을 시작할 수 없습니다. 페이지를 새로고침 후 다시 시도해주세요.");
			console.error(err);
		}
	};

	return (
		<main className={styles.main}>
			<div className={styles.title_wrap}>
				<h1 className={styles.title}>서울시50플러스포털 크롤러</h1>
				<a
					className={styles.title_link}
					href="https://50plus.or.kr"
					target="_blank"
					rel="noopener noreferrer"
				>
					바로가기
				</a>
			</div>
			<p>서울시50플러스포털크롤러는 서울시50플러스포털의 컨텐츠를 추출하는 확장 프로그램입니다</p>
			<p>오류 및 문의사항은 비즈플랫폼 개발팀 최영원에게 문의 주세요</p>
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
