"use client";

import type React from "react";

/**
 * Utility functions for robust HTML text highlighting & un-highlighting in contenteditable elements.
 * Uses atomic TreeWalker text node targeting to guarantee ZERO block element destruction,
 * ZERO yellow pill artifacts on line breaks, and EXACT 1-step Ctrl+Z undo behavior.
 */

function isTextNonEmpty(text: string | null | undefined): boolean {
  if (!text) return false;
  return text.replace(/[\s\u00a0\r\n]+/g, "").length > 0;
}

/**
 * TreeWalker text-node highlighter.
 * Highlights ONLY non-empty text nodes intersecting the selection range atomically in one step.
 * Never touches block elements (DIV, P, LI) or line breaks (BR).
 */
function highlightRangeWithTreeWalker(range: Range, color: string): void {
  const container = range.commonAncestorContainer;
  const root = container.nodeType === Node.ELEMENT_NODE ? container : container.parentNode;
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!isTextNonEmpty(node.textContent)) {
        return NodeFilter.FILTER_REJECT;
      }
      try {
        if (range.intersectsNode(node)) {
          return NodeFilter.FILTER_ACCEPT;
        }
      } catch (_e) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_REJECT;
    },
  });

  const nodesToHighlight: Text[] = [];
  let curr = walker.nextNode();
  while (curr) {
    nodesToHighlight.push(curr as Text);
    curr = walker.nextNode();
  }

  nodesToHighlight.forEach((textNode) => {
    let targetNode = textNode;

    if (textNode === range.endContainer && range.endOffset < textNode.length && range.endOffset > 0) {
      targetNode.splitText(range.endOffset);
    }
    if (textNode === range.startContainer && range.startOffset > 0 && range.startOffset < textNode.length) {
      targetNode = targetNode.splitText(range.startOffset);
    }

    if (isTextNonEmpty(targetNode.textContent)) {
      const parent = targetNode.parentNode;
      if (parent) {
        if (parent.nodeName === "MARK") {
          (parent as HTMLElement).style.backgroundColor = color;
          (parent as HTMLElement).style.color = "#000000";
        } else {
          const mark = document.createElement("mark");
          mark.style.backgroundColor = color;
          mark.style.color = "#000000";
          mark.style.borderRadius = "2px";
          mark.style.padding = "0px";
          mark.style.margin = "0px";
          parent.insertBefore(mark, targetNode);
          mark.appendChild(targetNode);
        }
      }
    }
  });
}

/**
 * Remove empty or whitespace-only mark tags from container
 */
export function removeEmptyMarkTags(container: HTMLElement): void {
  const marks = Array.from(container.querySelectorAll("mark, span[style*='background-color']"));
  marks.forEach((mark) => {
    const el = mark as HTMLElement;
    if (!isTextNonEmpty(el.textContent)) {
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
      }
    }
  });
}

/**
 * Merge adjacent <mark> tags that share the same background color into a single <mark> tag.
 * This prevents fragmented text/gaps within words when multiple highlights touch.
 */
export function mergeAdjacentMarkTags(container: HTMLElement): void {
  const marks = Array.from(container.querySelectorAll("mark, span[style*='background-color']"));
  marks.forEach((mark) => {
    const el = mark as HTMLElement;
    if (!el.parentNode) return;

    let next = el.nextSibling;
    while (next) {
      if (next.nodeType === Node.TEXT_NODE && (!next.textContent || next.textContent.length === 0)) {
        const temp = next.nextSibling;
        next.parentNode?.removeChild(next);
        next = temp;
        continue;
      }

      if (next.nodeType === Node.ELEMENT_NODE) {
        const nextEl = next as HTMLElement;
        const isNextMark = nextEl.tagName === "MARK" || !!nextEl.style.backgroundColor;

        if (isNextMark) {
          const bg1 = el.style.backgroundColor.trim().toLowerCase();
          const bg2 = nextEl.style.backgroundColor.trim().toLowerCase();

          if (bg1 === bg2 || (!bg1 && !bg2)) {
            while (nextEl.firstChild) {
              el.appendChild(nextEl.firstChild);
            }
            nextEl.parentNode?.removeChild(nextEl);
            next = el.nextSibling;
            continue;
          }
        }
      }
      break;
    }
    el.normalize();
  });
}

/**
 * Unwrap all highlight marks inside a container and strip lingering color overrides
 */
export function unwrapMarksInNode(container: Node): void {
  if (container.nodeType !== Node.ELEMENT_NODE && container.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
    return;
  }
  const el = container as HTMLElement;
  const list = Array.from(
    el.querySelectorAll
      ? el.querySelectorAll("mark, span[style*='background-color'], span[style*='color'], font")
      : []
  );

  list.forEach((node) => {
    const item = node as HTMLElement;
    item.style.backgroundColor = "";
    item.style.color = "";
    if (item.tagName === "FONT") {
      item.removeAttribute("color");
    }

    const styleAttr = item.getAttribute("style");
    const parent = item.parentNode;
    if (parent && (item.tagName === "MARK" || item.tagName === "FONT" || !styleAttr || styleAttr.trim() === "")) {
      while (item.firstChild) {
        parent.insertBefore(item.firstChild, item);
      }
      parent.removeChild(item);
    }
  });
}

/**
 * Apply highlight color atomically to current selection inside the editor.
 */
export function applyHighlightToSelection(editor: HTMLElement, color: string): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;

  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return false;

  highlightRangeWithTreeWalker(range, color);
  removeEmptyMarkTags(editor);
  mergeAdjacentMarkTags(editor);
  editor.normalize();

  sel.removeAllRanges();
  return true;
}

/**
 * Remove text color overrides from current selection in editor.
 */
export function clearTextColorFromSelection(editor: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;

  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return false;

  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      const el = node as HTMLElement;
      if ((el.tagName === "FONT" || (el.style && el.style.color)) && range.intersectsNode(node)) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    },
  });

  const elementsToClean: HTMLElement[] = [];
  let curr = walker.nextNode();
  while (curr) {
    elementsToClean.push(curr as HTMLElement);
    curr = walker.nextNode();
  }

  elementsToClean.forEach((el) => {
    el.style.color = "";
    if (el.tagName === "FONT") {
      el.removeAttribute("color");
    }
    const styleAttr = el.getAttribute("style");
    if (el.tagName === "FONT" || !styleAttr || styleAttr.trim() === "") {
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
      }
    }
  });

  removeEmptyMarkTags(editor);
  mergeAdjacentMarkTags(editor);
  editor.normalize();
  sel.removeAllRanges();
  return true;
}

/**
 * Remove highlight atomically from current selection inside the editor and strip text color overrides.
 */
export function clearHighlightFromSelection(editor: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;

  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return false;

  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      const el = node as HTMLElement;
      const hasBg = el.tagName === "MARK" || (el.style && el.style.backgroundColor);
      const hasColor = el.tagName === "FONT" || (el.style && el.style.color);
      if ((hasBg || hasColor) && range.intersectsNode(node)) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    },
  });

  const elementsToClean: HTMLElement[] = [];
  let curr = walker.nextNode();
  while (curr) {
    elementsToClean.push(curr as HTMLElement);
    curr = walker.nextNode();
  }

  elementsToClean.forEach((el) => {
    // 1. Remove background color
    el.style.backgroundColor = "";

    // 2. Clear inline text color so it inherits the note's theme color!
    el.style.color = "";
    if (el.tagName === "FONT") {
      el.removeAttribute("color");
    }

    // 3. Unwrap elements if no remaining styles exist
    const styleAttr = el.getAttribute("style");
    if (el.tagName === "MARK" || el.tagName === "FONT" || !styleAttr || styleAttr.trim() === "") {
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
      }
    }
  });

  removeEmptyMarkTags(editor);
  mergeAdjacentMarkTags(editor);
  editor.normalize();
  sel.removeAllRanges();
  return true;
}

/**
 * Remove ALL highlights from the editor content and restore theme default text color.
 */
export function clearAllHighlightsFromEditor(editor: HTMLElement): boolean {
  unwrapMarksInNode(editor);
  removeEmptyMarkTags(editor);
  editor.normalize();
  return true;
}

/**
 * Apply temporary vanishing highlight (3 seconds) for live presentation.
 */
export function applyVanishingHighlightToSelection(editor: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;

  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return false;

  const container = range.commonAncestorContainer;
  const root = container.nodeType === Node.ELEMENT_NODE ? container : container.parentNode;
  if (!root) return false;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!isTextNonEmpty(node.textContent)) {
        return NodeFilter.FILTER_REJECT;
      }
      try {
        if (range.intersectsNode(node)) {
          return NodeFilter.FILTER_ACCEPT;
        }
      } catch (_e) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_REJECT;
    },
  });

  const nodesToHighlight: Text[] = [];
  let curr = walker.nextNode();
  while (curr) {
    nodesToHighlight.push(curr as Text);
    curr = walker.nextNode();
  }

  if (nodesToHighlight.length === 0) return false;

  const createdSpans: HTMLSpanElement[] = [];

  nodesToHighlight.forEach((textNode) => {
    let targetNode = textNode;

    if (textNode === range.endContainer && range.endOffset < textNode.length && range.endOffset > 0) {
      targetNode.splitText(range.endOffset);
    }
    if (textNode === range.startContainer && range.startOffset > 0 && range.startOffset < textNode.length) {
      targetNode = targetNode.splitText(range.startOffset);
    }

    if (isTextNonEmpty(targetNode.textContent)) {
      const parent = targetNode.parentNode;
      if (parent) {
        const span = document.createElement("span");
        span.className = "vanishing-highlight-effect";
        span.style.backgroundColor = "#fde047";
        span.style.color = "#000000";
        span.style.padding = "0px 2px";
        span.style.borderRadius = "3px";
        span.style.boxShadow = "0 0 12px #facc15";
        span.style.transition = "opacity 0.6s ease-out";

        parent.insertBefore(span, targetNode);
        span.appendChild(targetNode);
        createdSpans.push(span);
      }
    }
  });

  sel.removeAllRanges();

  setTimeout(() => {
    createdSpans.forEach((span) => {
      span.style.opacity = "0";
    });
    setTimeout(() => {
      createdSpans.forEach((span) => {
        const parent = span.parentNode;
        if (parent) {
          while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
          }
          parent.removeChild(span);
        }
      });
      editor.normalize();
    }, 600);
  }, 3000);

  return true;
}

/**
 * Handle keydown events inside contenteditable to handle typing boundaries at <mark> tags.
 */
export function handleHighlightKeyDown(e: React.KeyboardEvent<HTMLDivElement>, editor: HTMLDivElement): boolean {
  if (e.key !== "Enter" && e.key !== " ") return false;

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;

  const range = sel.getRangeAt(0);
  let node: Node | null = range.commonAncestorContainer;
  let markNode: HTMLElement | null = null;

  while (node && node !== editor) {
    if (node.nodeType === Node.ELEMENT_NODE && ((node as HTMLElement).tagName === "MARK" || (node as HTMLElement).style.backgroundColor)) {
      markNode = node as HTMLElement;
      break;
    }
    node = node.parentNode;
  }

  if (!markNode) return false;

  const isAtEnd =
    range.endContainer === markNode ||
    (range.endContainer.nodeType === Node.TEXT_NODE &&
      range.endOffset === range.endContainer.textContent?.length &&
      (range.endContainer === markNode.lastChild || markNode.lastChild?.contains(range.endContainer)));

  if (isAtEnd) {
    if (e.key === " ") {
      e.preventDefault();
      const spaceNode = document.createTextNode(" ");
      if (markNode.nextSibling) {
        markNode.parentNode?.insertBefore(spaceNode, markNode.nextSibling);
      } else {
        markNode.parentNode?.appendChild(spaceNode);
      }
      const newRange = document.createRange();
      newRange.setStart(spaceNode, 1);
      newRange.setEnd(spaceNode, 1);
      sel.removeAllRanges();
      sel.addRange(newRange);
      return true;
    } else if (e.key === "Enter") {
      e.preventDefault();
      const brNode = document.createElement("br");
      const emptyText = document.createTextNode("");
      if (markNode.nextSibling) {
        markNode.parentNode?.insertBefore(brNode, markNode.nextSibling);
        markNode.parentNode?.insertBefore(emptyText, brNode.nextSibling);
      } else {
        markNode.parentNode?.appendChild(brNode);
        markNode.parentNode?.appendChild(emptyText);
      }
      const newRange = document.createRange();
      newRange.setStart(emptyText, 0);
      newRange.setEnd(emptyText, 0);
      sel.removeAllRanges();
      sel.addRange(newRange);
      return true;
    }
  }

  return false;
}
