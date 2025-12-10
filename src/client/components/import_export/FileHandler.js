// From :
// https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
export function downloadTextFile(filename, text) {
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

export function promptForFile(acceptedFiles, multiple = false) {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        if (acceptedFiles) input.accept = acceptedFiles;
        if (multiple) input.multiple = true;

        input.style.display = 'none';
        document.body.appendChild(input);

        input.addEventListener('change', () => {
            resolve(input.files);  // FileList
            document.body.removeChild(input);
        });

        input.addEventListener("cancel", () => {
            document.body.removeChild(input);
        });

        input.click();
    });
}