import Selecto from "selecto";
import * as XLSX from "xlsx";

let selecto: Selecto | null = null;
let selectedAreas: Set<HTMLElement | SVGElement> = new Set();
let overlay: HTMLElement | null = null;

// 크롤링 제외할 텍스트
const EXCLUDED_TEXT = ["javascript:void(0);"];

// 모든 텍스트 노드를 수집하는 함수
const getAllTextNodes = (element: Element) => {
	const textSet = new Set<string>();

	// 현재 요소가 이미지인 경우 src 추가
	if (element instanceof HTMLImageElement && !EXCLUDED_TEXT.includes(element.src)) {
		const src = element.src;
		if (src) textSet.add(src);
	}

	// 현재 요소가 링크인 경우 href 추가
	if (element instanceof HTMLAnchorElement && !EXCLUDED_TEXT.includes(element.href)) {
		const href = element.href;
		if (href) textSet.add(href);
	}

	// 현재 요소의 직접적인 텍스트 노드 처리
	if (
		element.childNodes.length === 1 &&
		element.childNodes[0].nodeType === Node.TEXT_NODE &&
		!EXCLUDED_TEXT.includes(element.textContent?.trim() || "")
	) {
		const text = element.textContent?.trim();
		if (text) textSet.add(text);
	}

	// 자식 요소들 순회
	element.childNodes.forEach((node) => {
		if (node.nodeType === Node.ELEMENT_NODE) {
			// 재귀적으로 자식 요소의 텍스트 노드와 이미지 src 수집
			getAllTextNodes(node as Element).forEach((text) => textSet.add(text));
		}
	});

	return [...textSet.values()];
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
	exportButton.innerHTML = `선택 영역 ${selectedAreas.size}개 추출`;
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
			[...selectedAreas.values()].forEach((selectedArea) => {
				const tr = document.createElement("tr");

				// 모든 텍스트 노드 수집
				const texts = getAllTextNodes(selectedArea);

				// 각 텍스트를 별도의 셀로 추가
				texts.forEach((text) => {
					// 빈 텍스트 제외
					if (text.trim() === "") return;
					const cell = document.createElement("td");
					cell.innerHTML = /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)$/i.test(text)
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
			XLSX.writeFile(workbook, "seoul50plus.xlsx");
			// HTML 테이블 미리보기 (선택사항)
			const preview = window.open("", "_blank");
			if (preview) {
				preview.document.write(`
					<html lang="ko">
						<head>
							<title>선택된 데이터 미리보기</title>
							<style>
								table { border-collapse: collapse; width: 100%; table-layout: fixed; }
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
		case "PING":
			sendResponse({ status: "OK" });
			return true;
		case "START":
			resetAll();
			startAll();
			sendResponse({ status: "OK" });
			return true;
		case "RESET":
			resetAll();
			sendResponse({ status: "OK" });
			return true;
	}
});

// 키보드 이벤트 리스너 설정
window.addEventListener("keydown", ({ key }) => {
	if (key === "Escape") resetAll();
});
