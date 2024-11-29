import os

def print_js_files(directory):
    # Walk through the directory
    for root, dirs, files in os.walk(directory):
        # Filter for .js files
        js_files = [f for f in files if f.endswith('.js')]
        
        for js_file in js_files:
            file_path = os.path.join(root, js_file)
            # Print the file path
            print("\n" + "="*80)
            print(f"File: {file_path}")
            print("="*80)
            
            # Read and print the file contents
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    print(content)
            except Exception as e:
                print(f"Error reading file: {str(e)}")

if __name__ == "__main__":
    # Get the absolute path to the src directory
    src_dir = os.path.join(os.path.dirname(__file__), "src")
    print_js_files(src_dir)
