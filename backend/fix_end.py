import re

with open(r'C:\Projects\StudyMate\backend\src\index.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the end of the file
# Replace the messy end with proper closing
pattern = r'\};\s*\n\s*\}\s*\n\s*\}\s*\n\s*\}\s*satisfies ExportedHandler<Env>'
replacement = '}\n} satisfies ExportedHandler<Env>'
content = re.sub(pattern, replacement, content)

with open(r'C:\Projects\StudyMate\backend\src\index.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed end of file")