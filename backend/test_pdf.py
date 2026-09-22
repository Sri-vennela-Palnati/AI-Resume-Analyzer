from pypdf import PdfReader

pdf_path = "sample_resume.pdf"

reader = PdfReader(pdf_path)

text = ""

for page in reader.pages:
    page_text = page.extract_text()

    if page_text:
        text += page_text + "\n"

print("\n========== EXTRACTED RESUME TEXT ==========\n")
print(text)
print("\n===========================================\n")
print("Number of pages:", len(reader.pages))
print("Characters extracted:", len(text))