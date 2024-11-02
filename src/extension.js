// @author: Gael Lopes Da Silva
// @project: Spaced
// @github: https://github.com/Gael-Lopes-Da-Silva/SpacedVSCode

const vscode = require('vscode');

let decorationType = null;
let timeout = null;

let highlight = true;
let backgroundColor = "#ff000050";
let borderRadius = 3;
let borderColor = "#ff0000";
let borderSize = 1;
let maxFileSize = 1000000;
let maxLineCount = 10000;
let delay = 900;

// ----------------------------------------------------

function activate(context) {
    loadConfiguration();
    createDecorationType();

    context.subscriptions.push(
        vscode.commands.registerCommand('spaced.toggleHighlight', toggleHighlight),
        vscode.commands.registerCommand('spaced.removeTrailingWhitespace', removeTrailingWhitespace),
        vscode.window.onDidChangeActiveTextEditor(onDidChangeActiveTextEditor),
        vscode.workspace.onDidChangeTextDocument(onDidChangeTextDocument),
        vscode.workspace.onDidChangeConfiguration(onDidChangeConfiguration)
    );

    updateDecorations();
}

function deactivate() {
    clearDecorations();
}

// ----------------------------------------------------

function loadConfiguration() {
    const config = vscode.workspace.getConfiguration('spaced');

    highlight = config.inspect('highlight').globalValue || config.get('highlight');
    backgroundColor = config.inspect('backgroundColor').globalValue || config.get('backgroundColor');
    borderRadius = config.inspect('borderRadius').globalValue || config.get('borderRadius');
    borderColor = config.inspect('borderColor').globalValue || config.get('borderColor');
    borderSize = config.inspect('borderSize').globalValue || config.get('borderSize');
    maxFileSize = config.inspect('maxFileSize').globalValue || config.get('maxFileSize');
    maxLineCount = config.inspect('maxLineCount').globalValue || config.get('maxLineCount');
    delay = config.inspect('delay').globalValue || config.get('delay');
}

function createDecorationType() {
    decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: backgroundColor,
        border: `${borderSize}px solid ${borderColor}`,
        borderRadius: `${borderRadius}px`
    });
}

function toggleHighlight() {
    highlight = !highlight;

    if (highlight) {
        updateDecorations();
    } else {
        clearDecorations();
    }

    vscode.window.showInformationMessage(`Trailing spaces highlight is now ${highlight ? 'on' : 'off'}.`);
}

function onDidChangeActiveTextEditor() {
    updateDecorations();
}

function onDidChangeTextDocument(event) {
    const activeTextEditor = vscode.window.activeTextEditor;
    if (!activeTextEditor) return;

    if (event.document === activeTextEditor.document) {
        if (timeout) clearTimeout(timeout);

        timeout = setTimeout(() => {
            updateDecorations();
        }, delay);
    }
}

function onDidChangeConfiguration(event) {
    if (event.affectsConfiguration('spaced')) {
        clearDecorations();
        loadConfiguration();
        createDecorationType();
        updateDecorations();
    }
}

function updateDecorations() {
    if (!highlight) return;

    const activeTextEditor = vscode.window.activeTextEditor;
    if (!activeTextEditor) return;

    const text = activeTextEditor.document.getText();
    if (maxFileSize !== null && text.length > maxFileSize || maxLineCount !== null && activeTextEditor.document.lineCount > maxLineCount) return;

    const regex = new RegExp("[ \\t]+$", 'gm');
    const ranges = [];

    let match;
    while ((match = regex.exec(text))) {
        const startPos = activeTextEditor.document.positionAt(match.index);
        const endPos = activeTextEditor.document.positionAt(match.index + match[0].length);

        ranges.push(new vscode.Range(startPos, endPos));
    }

    if (decorationType === null) createDecorationType();

    activeTextEditor.setDecorations(decorationType, ranges);
}

function clearDecorations() {
    const activeTextEditor = vscode.window.activeTextEditor;
    if (!activeTextEditor && !decorationType) return;

    activeTextEditor.setDecorations(decorationType, []);
}

function removeTrailingWhitespace() {
    const activeTextEditor = vscode.window.activeTextEditor;
    if (!activeTextEditor) return;

    const text = activeTextEditor.document.getText();
    if (maxFileSize !== null && text.length > maxFileSize || maxLineCount !== null && activeTextEditor.document.lineCount > maxLineCount) {
        vscode.window.showInformationMessage('This file is too large. Check the extension configuration for more info.');
        return;
    }

    const regex = new RegExp("[ \\t]+$", 'gm');
    const edits = [];

    let match;
    while ((match = regex.exec(text))) {
        const startPos = activeTextEditor.document.positionAt(match.index);
        const endPos = activeTextEditor.document.positionAt(match.index + match[0].length);

        edits.push(new vscode.Range(startPos, endPos));
    }

    activeTextEditor.edit(editBuilder => {
        edits.forEach(range => editBuilder.delete(range));
    });
}

module.exports = {
    activate,
    deactivate
};