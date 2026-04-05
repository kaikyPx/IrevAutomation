import pypdf
import sys

def extract_all_text(file_path, output_file):
    try:
        reader = pypdf.PdfReader(file_path)
        with open(output_file, "w", encoding="utf-8") as f:
            for i, page in enumerate(reader.pages):
                f.write(f"--- Page {i+1} ---\n")
                f.write(page.extract_text())
                f.write("\n\n")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_all_text("partners-platlform-private-api-documentation.pdf", "full_text.txt")
