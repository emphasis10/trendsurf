from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable
import xml.etree.ElementTree as ET


TEI_NS = {
  "tei": "http://www.tei-c.org/ns/1.0",
}


@dataclass
class Section:
  title: str | None
  paragraphs: list[str]

  @property
  def text(self) -> str:
    return "\n".join(self.paragraphs)


@dataclass
class ParsedDocument:
  title: str | None
  abstract: str | None
  body: list[Section]
  references: list[str]

  @property
  def concatenated_body(self) -> str:
    return "\n\n".join(section.text for section in self.body if section.paragraphs)


def parse_tei(tei_xml: str) -> ParsedDocument:
  root = ET.fromstring(tei_xml)
  title = _first_text(root.findall(".//tei:titleStmt/tei:title", TEI_NS))
  abstract = "\n".join(_iter_text(root.findall(".//tei:abstract//tei:p", TEI_NS)))
  body_sections = _parse_sections(root)
  references = [
    _normalize_whitespace(ref)
    for ref in _iter_text(root.findall(".//tei:listBibl/tei:biblStruct", TEI_NS))
    if ref
  ]
  return ParsedDocument(title=title, abstract=abstract, body=body_sections, references=references)


def _parse_sections(root: ET.Element) -> list[Section]:
  sections: list[Section] = []
  for div in root.findall(".//tei:body/tei:div", TEI_NS):
    head = _first_text(div.findall("tei:head", TEI_NS))
    paragraphs = list(_iter_text(div.findall("tei:p", TEI_NS)))
    if not paragraphs:
      continue
    sections.append(Section(title=head, paragraphs=[_normalize_whitespace(p) for p in paragraphs if p]))
  return sections


def _iter_text(nodes: Iterable[ET.Element]) -> Iterable[str]:
  for node in nodes:
    text_parts = [node.text or ""]
    text_parts.extend(child.tail or "" for child in node)
    yield _normalize_whitespace("".join(text_parts))


def _first_text(nodes: Iterable[ET.Element]) -> str | None:
  for node in nodes:
    text = _normalize_whitespace(node.text or "")
    if text:
      return text
  return None


def _normalize_whitespace(text: str) -> str:
  return " ".join(text.split())
