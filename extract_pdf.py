import pypdf
import sys

def extract_text(file_path, search_term, output_file):
    try:
        reader = pypdf.PdfReader(file_path)
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(f"Total pages: {len(reader.pages)}\n")
            
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if search_term.lower() in text.lower():
                    f.write(f"--- Page {i+1} ---\n")
                    f.write(text)
                    f.write("\n-----------------\n\n")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_text("partners-platlform-private-api-documentation.pdf", "offline-stats", "output_utf8.txt")
