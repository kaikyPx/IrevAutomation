import pypdf

reader = pypdf.PdfReader("partners-platlform-private-api-documentation.pdf")
with open("peek_final.txt", "w", encoding="utf-8") as f:
    f.write(f"Total pages: {len(reader.pages)}\n")
    for i, page in enumerate(reader.pages):
        try:
            text = page.extract_text()
            clean_text = " ".join(text.split())
            f.write(f"P{i+1}: {clean_text[:120]}\n")
        except Exception as e:
            f.write(f"P{i+1}: ERROR - {e}\n")
