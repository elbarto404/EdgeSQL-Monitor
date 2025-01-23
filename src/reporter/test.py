import os
import subprocess

def compile_latex(tex_file_path):
    # Ottieni la directory del file .tex
    tex_dir = os.path.dirname(tex_file_path)

    try:
        # Compila il file LaTeX usando pdflatex
        result = subprocess.run(
            ['pdflatex', '-output-directory', tex_dir, tex_file_path],
            check=True,
            text=True,
            capture_output=True
        )
        print("Compilazione completata con successo!")
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print("Errore durante la compilazione:")
        print(e.stderr)

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    tex_file = os.path.join(base_dir, 'temp', 'report.tex')

    if os.path.exists(tex_file):
        compile_latex(tex_file)
    else:
        print(f"Il file {tex_file} non esiste. Assicurati che sia presente nella directory.")

if __name__ == "__main__":
    main()
