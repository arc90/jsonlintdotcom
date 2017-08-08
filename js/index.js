/* global ga */
import CodeMirror from 'codemirror/lib/codemirror';
import jsonlint from 'exports?jsonlint!jsonlint/web/jsonlint';
import jsonParse from 'exports?json_parse!json2/json_parse';
import beautify from 'js-beautify/js/lib/beautify';
import minify from 'jsonminify';
import $ from 'balajs';
import 'codemirror/mode/javascript/javascript';
import fetchExternal from './fetch-external';
import parseQuery from './parse-query';


const doc = document;

module.exports = new class Application {
    constructor() {
        const form = this.form = doc.forms.main;
        const query = this.query = parseQuery();

        this
            .initEditor()
            .registerEvents();

        // define 'code' accessors
        Object.defineProperty(this, 'code', {
            get() {
                return this.editor.getValue();
            },
            set(v) {
                form.code.value = v;
                this.editor.setValue(v);
            }
        });

        // if json parameter is given, use it
        // URL (where JSON is located) is also allowed
        if (query.json) {
            this.code = query.json;
            this.go();
        }
    }

    // registers events
    registerEvents() {
        // when user types something, remove highlighting from "bad" line
        this.editor.on('change', () => this.highlightErrorLine(null));

        // when user submits form (eg presses "Validate" button), call "go" method
        this.form.addEventListener('submit', evt => {
            evt.preventDefault();
            this.go();
        });

        // when user clicks "Clear" button, assign empty string to the "code" property
        this.form.addEventListener('reset', evt => {
            evt.preventDefault();
            this.code = '';
        });

        // when Ctrl-Enter is pressed, run "go" method
        doc.addEventListener('keyup', evt => {
            const ENTER_KEY = 13;
            if (evt.ctrlKey && evt.keyCode === ENTER_KEY) {
                this.go();
            }
        });

        // expands/unexpands faq by clicking #faqButton
        $.one('#faqButton').addEventListener('click', evt => {
            evt.preventDefault();
            $.one('#faq').classList.toggle('expand');
        });

        // initializes Google Analytics tracking
        // when user clicks on [data-ga="blah"], call ga('send', 'pageview', '/blah');
        $('[data-ga]').forEach(node => {
            node.addEventListener('click', () =>
                ga('send', 'pageview', `/${node.getAttribute('data-ga')}`));
        });

        $.one('.compress').addEventListener('click', evt => {
            evt.preventDefault();
            $.one('.compress').classList.toggle('active');
        });

        return this;
    }

    // initializes CodeMirror editor
    initEditor() {
        this.editor = CodeMirror.fromTextArea(this.form.code, {
            lineNumbers: true,
            styleActiveLine: true,
            matchBrackets: true,
            indentWithTabs: true,
            autofocus: true,
            mode: 'javascript'
        });

        if(this.query.reformat === 'compress' && !$.one('.compress').classList.contains('active')){
            $.one('.compress').classList.add('active')
        }

        return this;
    }

    // the main function of this app
    go() {
        const code = this.code;
        const trimmedCode = code.trim();
        // if URL is given, fetch data on this URL
        if (trimmedCode.indexOf('http') === 0) {
            fetchExternal(trimmedCode,
                resp => this.validate(resp), // if fetching is OK, run validator
                err => this.notify(false, err) // if not, show an error
            );
        } else {
            // if non-url is given, run validator
            this.validate();
        }

        return this;
    }

    // reformats JSON depending on query.reformat value
    // code argument is optional
    reformat(givenCode) {
        let code = typeof givenCode === 'undefined' ? this.code : givenCode;

        // if reformat==compress, use minifier
        // if reformat==no, keep code as is
        // else beautify code
        if ($.one('.compress').classList.contains('active')) {
            code = minify(code) || code;
        } else if (this.query.reformat !== 'no') {
            code = beautify.js_beautify(code, {
                indent_with_tabs: true
            });
        }

        this.code = code;

        return this;
    }

    // validates JSON
    // givenCode argument is optional
    validate(givenCode) {
        let lineMatches;

        this.reformat(givenCode);

        const { code } = this;

        try {
            jsonlint.parse(code);

            try {
                // use another parser to check for repeated properties and bad hidden chars
                jsonParse(code);

                this.notify(true, 'Valid JSON');
            } catch (e) {
                // e.at contains char number, converting it to line number
                const lineNumber = code.substring(0, e.at).split('\n').length - 1;

                this.highlightErrorLine(lineNumber);
                this.notify(false, `${e.name}: ${e.message}`);
            }
        } catch (e) {
            // retrieve line number from error string
            lineMatches = e.message.match(/line ([0-9]*)/);

            if (lineMatches && lineMatches.length > 1) {
                this.highlightErrorLine(+lineMatches[1] - 1);
            }

            this.notify(false, e);
        }

        return this;
    }

    // displays success or error message about validation status
    notify(success, text) {
        const result = $.one('#result');
        $.one('#result-container').classList.add('shown');
        // ie10 doesn't support 2nd argument in classList.toggle
        result.classList[success ? 'add' : 'remove']('success');
        result.classList[!success ? 'add' : 'remove']('error');
        result.innerHTML = text;

        return this;
    }

    // highlights given line of code
    // if null is passed function removes highlighting
    highlightErrorLine(line) {
        if (typeof line === 'number') {
            this.errorLine = this.editor.addLineClass(line, 'background', 'line-error');
            this.editor.setCursor(line);
        } else if (this.errorLine) {
            this.editor.removeLineClass(this.errorLine, 'background', 'line-error');
            this.errorLine = null;
        }

        return this;
    }
};
