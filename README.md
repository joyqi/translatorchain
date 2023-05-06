# Translator Chain

A Node.js command line tool to translate formatted localized strings into other languages using OpenAI's GPT API.

## How it works

1. Read a file containing a list of strings to translate.
2. Unmarshal the file into a structured object.
3. Compare the structured object to a list of previously translated strings, pick those that have not been translated yet, and create a new data structure containing only those strings.
4. Split the strings into chunks by GPT's max token length.
5. Send each chunk to the GPT API for translation.
6. Combine the translated chunks into a single data structure.
7. Combine the translated strings with the previously translated strings.
8. Marshal the data structure into a file.

## Installation

```bash
npm install -g translatorchain
```

## Usage

```bash
tc -k <api-key> -o <output-file> -d <dest-language> -s <src-language> <input-file>
```

You can specify the OpenAI API key using the `-k` flag or by setting the `OPENAI_API_KEY` environment variable.