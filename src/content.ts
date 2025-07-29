import Selecto from "selecto";
import * as XLSX from "xlsx";

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
/** 컨텐츠 타입 */
const CONTENT_TYPE_KO = {
	EMPLOYMENT: "일자리",
	LIFESTYLE: "복지·건강",
	OTHER: "중장년 매거진",
} as const;
// 제외할 텍스트
const EXCLUDED_TEXT = ["javascript:void(0);"];
// 크롤링할 클래스명
const TARGET_CLASSNAMES = [
	"board-box__info__title",
	"board-box__img-wrapper",
	"board-card__info__title",
	"board-card__custom-height-img",
];

let selecto: Selecto | null = null;
let selectedAreas: Set<HTMLElement | SVGElement> = new Set();
let overlay: HTMLElement | null = null;
let currentContentType: keyof typeof CONTENT_TYPE = CONTENT_TYPE.EMPLOYMENT;

// 모든 텍스트 노드를 수집하는 함수
const getAllTextNodes = (element: Element) => {
	const texts: string[] = [];

	// 현재 요소가 링크인 경우 href 추가
	if (
		element instanceof HTMLAnchorElement &&
		!EXCLUDED_TEXT.includes(element.href)
	) {
		const { href } = element;
		if (href) texts.push(href);
	}

	// 현재 요소가 이미지인 경우 src 추가
	if (
		element instanceof HTMLImageElement &&
		TARGET_CLASSNAMES.includes(element.className)
	) {
		const { src } = element;
		if (src) texts.push(src);
	}

	// 현재 요소의 텍스트 노드 처리
	if (
		element.childNodes.length === 1 &&
		element.childNodes[0].nodeType === Node.TEXT_NODE &&
		TARGET_CLASSNAMES.includes(element.className) &&
		!EXCLUDED_TEXT.includes(element.textContent?.trim() || "")
	) {
		// 현재 요소의 직접적인 텍스트 노드 처리
		const text = element.textContent?.trim();
		if (text) texts.push(text);
	}

	// 자식 요소들 순회
	element.childNodes.forEach((node) => {
		if (node.nodeType === Node.ELEMENT_NODE) {
			// 재귀적으로 자식 요소의 텍스트 노드와 이미지 src 수집
			texts.push(...getAllTextNodes(node as Element));
		}
	});

	return texts;
};

/** 링크 비활성화 */
const disableLinks = () => {
	const links = window.document.querySelectorAll("a");
	links.forEach((link) => {
		link.style.pointerEvents = "none";
	});
};

/** 링크 활성화 */
const enableLinks = () => {
	const links = window.document.querySelectorAll("a");
	links.forEach((link) => {
		link.style.pointerEvents = "";
	});
};

/** 내보내기 버튼 제거 */
const removeExportButton = () => {
	const exportButton = window.document.querySelector(".export-button");
	if (exportButton) exportButton.remove();
};

/** 내보내기 버튼 표시 */
const showExportButton = () => {
	removeExportButton();
	const exportButton = window.document.createElement("button");
	exportButton.className = "export-button";
	exportButton.innerHTML = `${CONTENT_TYPE_KO[currentContentType]} 선택 영역 ${selectedAreas.size}개 추출`;
	exportButton.style.position = "fixed";
	exportButton.style.top = "10px";
	exportButton.style.right = "10px";
	exportButton.style.zIndex = "1000";
	exportButton.style.backgroundColor = "#4a90e2";
	exportButton.style.color = "white";
	exportButton.style.border = "none";
	exportButton.style.borderRadius = "4px";
	exportButton.style.padding = "8px 16px";
	exportButton.style.cursor = "pointer";
	exportButton.onmouseenter = () => {
		exportButton.style.backgroundColor = "#357ebd";
	};
	exportButton.onmouseleave = () => {
		exportButton.style.backgroundColor = "#4a90e2";
	};
	exportButton.onclick = () => {
		try {
			// 선택된 요소들을 HTML 테이블로 변환
			const table = document.createElement("table");

			const selectedAreasArray = [...selectedAreas.values()];

			selectedAreasArray.forEach((selectedArea) => {
				const tr = document.createElement("tr");

				// 모든 텍스트 노드 수집
				const texts = getAllTextNodes(selectedArea);

				if (
					currentContentType === CONTENT_TYPE.EMPLOYMENT ||
					currentContentType === CONTENT_TYPE.LIFESTYLE
				) {
					texts.splice(1, 0, "");
				}

				console.log(new Set(texts));

				// Set으로 중복 제거 후 각 텍스트를 별도의 셀로 추가
				[...new Set(texts).values()].forEach((text, index) => {
					console.log(text);

					// 최초 컨텐츠 타입 추가
					if (index === 0) {
						const td = document.createElement("td");
						td.textContent = currentContentType;
						tr.appendChild(td);
					}

					const cell = document.createElement("td");
					cell.innerHTML =
						/\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)$/i.test(text)
							? `<img alt="${text}" src="${text}" style="width: 100%; height: 100%; object-fit: contain;" /><span style="display: none;">${text}</span>`
							: text;
					tr.appendChild(cell);
				});

				table.appendChild(tr);
			});

			// 테이블을 워크시트로 변환
			const worksheet = XLSX.utils.table_to_sheet(table);
			// 워크북 생성 및 저장
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
			XLSX.writeFile(workbook, `${currentContentType}.xlsx`);
			// HTML 테이블 미리보기 (선택사항)
			const preview = window.open("", "_blank");
			if (preview) {
				preview.document.write(`
					<html>
						<head>
							<title>선택된 데이터 미리보기</title>
							<style>
								table { border-collapse: collapse; width: 100%; }
								th, td { border: 1px solid #ddd; padding: 8px; }
								th { background-color: #f5f5f5; }
							</style>
						</head>
						<body>
							${table.outerHTML}
						</body>
					</html>
				`);
			}
		} catch (error) {
			console.error("Excel 변환 중 오류 발생:", error);
			alert("Excel 변환 중 오류가 발생했습니다.");
		}
		resetAll();
	};
	window.document.body.appendChild(exportButton);
};

/** 오버레이 제거 */
const removeOverlay = () => {
	overlay?.remove();
};

/** 오버레이 생성 */
const showOverlay = () => {
	removeOverlay();
	overlay = window.document.createElement("div");
	overlay.style.background = "rgba(0, 0, 0, 0.5)";
	overlay.style.position = "fixed";
	overlay.style.top = "0";
	overlay.style.left = "0";
	overlay.style.width = "100vw";
	overlay.style.height = "100vh";
	overlay.style.zIndex = "500";
	window.document.body.appendChild(overlay);
};

/** 영역 선택 시작*/
const startSelection = () => {
	selecto = new Selecto({
		container: document.body,
		rootContainer: document.body,
		selectByClick: true,
		selectFromInside: false,
		continueSelect: false,
		selectableTargets: [".board-card", ".board-box"],
		toggleContinueSelect: "shift",
		keyContainer: window,
		hitRate: 0,
		preventDefault: true,
		scrollOptions: {
			container: document.body,
			throttleTime: 30,
			threshold: 0,
			getScrollPosition: () => [window.scrollX, window.scrollY],
		},
	});

	selecto.on("select", (e) => {
		const oldExportButton = window.document.querySelector(".export-button");
		if (oldExportButton) oldExportButton.remove();

		e.selected.forEach((selectedArea) => {
			selectedAreas.add(selectedArea);
			selectedArea.style.backgroundColor = "white";
			selectedArea.style.position = "relative";
			selectedArea.style.zIndex = "1000";
		});
		if (selectedAreas.size > 0) showExportButton();
	});
};

/** 모든 요소 초기화 */
const resetAll = () => {
	enableLinks();
	removeOverlay();
	removeExportButton();
	[...selectedAreas.values()].forEach((selectedArea) => {
		selectedArea.style.backgroundColor = "";
		selectedArea.style.position = "";
		selectedArea.style.zIndex = "";
	});
	selectedAreas = new Set();
	selecto?.destroy();
	selecto = null;
};

/** 모든 요소 시작 */
const startAll = () => {
	disableLinks();
	showOverlay();
	startSelection();
};

// 메시지 리스너 설정
window.chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
	switch (message.type) {
		case MESSAGE_TYPE.PING:
			sendResponse({ status: "OK" });
			return true;
		case MESSAGE_TYPE.START:
			currentContentType = message.contentType;
			resetAll();
			startAll();
			sendResponse({ status: "OK" });
			return true;
		case MESSAGE_TYPE.RESET:
			resetAll();
			sendResponse({ status: "OK" });
			return true;
		case MESSAGE_TYPE.LINK_EMPLOYMENT:
			window.location.href = "https://50plus.or.kr/PolicyInfo_Job.do";
			return true;
		case MESSAGE_TYPE.LINK_LIFESTYLE:
			window.location.href =
				"https://50plus.or.kr/PolicyInfo_Welfare-Health.do";
			return true;
		case MESSAGE_TYPE.LINK_OTHER:
			window.location.href = "https://50plus.or.kr/Magazine.do";
	}
});

// 키보드 이벤트 리스너 설정
window.addEventListener("keydown", ({ key }) => {
	if (key === "Escape") resetAll();
});
