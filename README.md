# Translator Chain

A Node.js command line tool to translate formatted localized strings into other languages using OpenAI's GPT API.

## Features

- 🤖️ Translate strings in a file using OpenAI's GPT API.
- 🚀 Automatically split strings into chunks by GPT's max token length.
- 💰 Compare the strings to a list of previously translated strings and only translate those that have not been translated yet.

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
tc -k <api-key> -o <output-file> <input-file>
```

You can specify the OpenAI API key using the `-k` flag or by setting the `OPENAI_API_KEY` environment variable.

Supported arguments:

- `-k`, `--key`: OpenAI API key
- `-o`, `--output`: Output file
- `-s`, `--src`: Source language (default: `auto`, detected automatically)
- `-d`, `--dst`: Destination language (default: `English`)
- `-f`, `--format`: Input file format (default: `auto`, detected automatically)
- `-t`, `--type`: Data structure type (default: `auto`, detected automatically)
- `-c`, `--chunk`: Chunk size (default: `500`)
- `-m`, `--model`: GPT chat model (default: `gpt-3.5-turbo-0301`)
- `-p`, `--prompt`: GPT prompt to describe what the translation document is about (e.g. `This is a iOS app to help you learn English.`)
- `-h`, `--help`: Show help

## Supported data structure types (`-t` flag)

### `auto`

Automatically detect the data structure type.

### `kv`

Key-value pairs.

Sample input file(json format):

```json
{
    "lang": "中文(简体)",
    "description": "这是一个自动翻译工具。",
    "hello": "你好，世界！",
    "goodbye": "再见！",
    "login": "登录",
    "logout": "登出"
}
```

### `tree`

Tree structure.

Sample input file(json format):

```json
{
    "lang": "中文(简体)",
    "description": "这是一个自动翻译工具。",
    "hello": "你好，世界！",
    "goodbye": "再见！",
    "login": "登录",
    "logout": "登出",
    "menu": {
        "home": "主页",
        "about": "关于",
        "contact": "联系我们"
    }
}
```
## Supported file formats (`-f` flag)

* `auto`: Automatically detect the file format.
* `json`: JSON format.
* `yaml`: YAML format.
* `markdown`: Markdown format.