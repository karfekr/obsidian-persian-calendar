<div dir="ltr" align="center">

[**English**](CONTRIBUTING.md) / [**فارسی**](CONTRIBUTING_FA.md)

</div>

# Contribution Guide

Welcome to the community that keeps this project alive💚

As I write this, the project has **over 10,000 downloads** – which means every bug fix, every
suggestion, every small improvement can enhance the experience of thousands of people.

Contributing is not just about writing code. Reporting bugs, suggesting new features, improving
documentation, answering user questions, introducing the plugin to friends, or even giving simple
feedback are all part of this project's growth.

If you would like to join us in developing this plugin, please read the following notes.

## How to Contribute

1. **Fork** the repository.
2. Create a **branch** with a clear name (e.g., `fix/calendar-header` or `feature/shortcut`).
3. Apply your changes and write small, meaningful commits.
4. Specify the version via `git tag` and the `manifest.json` file, and run the command
   `pnpm run version`.
5. Finally, open a Pull Request and describe precisely what problem it solves in the description.

> The architecture of this project is inspired by successful plugins such as
> [notebook-navigator](https://github.com/johansan/notebook-navigator),
> [Templater](https://github.com/SilentVoid13/Templater), and
> [Journals](https://github.com/srg-kostyrko/obsidian-journal). If you wish to improve this
> structure, please consult us first.

> All code formatting templates are defined by **editorconfig**, **biome.json**, etc. We ask you **not to change this framework** and to submit your code
> following the same standards.

> The only external dependency of this plugin on the user side is the
> [`@internationalized/date`](https://www.npmjs.com/package/@internationalized/date) library from
> Adobe's React-Aria suite. Please avoid adding new libraries without consulting us.

## For newcomers to Obsidian plugin development

If you have no experience developing Obsidian plugins but are eager to join us, we suggest the
following path:

**Learn TypeScript**: [I recommend this video](https://www.youtube.com/watch?v=BCg4U1FzODs)

**Get familiar with the structure of Obsidian plugins**:
[I recommend this video](https://www.youtube.com/watch?v=AgXa03ZxJ88)

**Understand the basic functions of this plugin**: You can learn about these functions by referring
to [this note](src/utils/README.md) and use them in development.

**For challenges**: You can refer to the
[official Obsidian plugin development documentation](https://docs.obsidian.md) or get help from
language models like [Claude](https://claude.ai), [ChatGPT](https://chatgpt.com),
[Gemini](https://gemini.google.com), and [DeepSeek](https://chat.deepseek.com).

## Communication

You can reach us via GitHub Issues on this page or through the following Accounts:

<div align="center">

[![Telegram](https://img.shields.io/badge/Telegram-@HMalek-26A5E4?logo=telegram&logoColor=white)](https://t.me/HMalek)
[![Telegram](https://img.shields.io/badge/Telegram-@NedaManiOfficial-26A5E4?logo=telegram&logoColor=white)](https://t.me/NedaManiOfficial)

</div>
