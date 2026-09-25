import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Running a project's own scripts on Windows.
 *
 * On 2026-09-25 the first Windows run of Bang reached the board and then could not
 * move a card. Dragging it to Spec was refused with `spawn EFTYPE`, which is Node
 * saying it was handed a file the operating system will not execute. The file was
 * `scripts/column-entry.sh`. On a Mac the kernel reads the shebang and runs bash;
 * Windows has no shebang, so a `.sh` is a text file and `CreateProcess` refuses it.
 *
 * Nothing about the project was wrong. A project's entry checks, its Try it script and
 * its hooks are shell scripts because that is what they are on every machine; what
 * changes on Windows is who has to start them.
 *
 * Every function here is a pure decision with the platform passed in, so the Windows
 * behaviour is testable from a Mac, which is the only machine this was written on.
 */

/** Where Git for Windows puts bash when nothing on PATH answers. */
const GIT_BASH_FALLBACKS = [
  "C:\\Program Files\\Git\\bin\\bash.exe",
  "C:\\Program Files\\Git\\usr\\bin\\bash.exe",
  "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
];

/**
 * The name of a program, looked up the way this platform looks things up.
 *
 * `which` is not a Windows command. All ten of the daemon's `execSync("which …")`
 * calls would have failed on the next Windows run, after the EFTYPE above was out of
 * the way, and failed in the worker launch where it is least visible. `where` is the
 * Windows spelling and prints one match per line, so the first line is the answer.
 */
export function whichCommand(name: string, platform: string = process.platform): string {
  return platform === "win32" ? `where ${name}` : `which ${name}`;
}

/** The first path `whichCommand` finds, or "" when it finds none. */
export function whichSync(name: string, platform: string = process.platform): string {
  try {
    const out = execSync(whichCommand(name, platform), { encoding: "utf-8", stdio: "pipe" });
    return String(out).split(/\r?\n/).map((l) => l.trim()).filter(Boolean)[0] ?? "";
  } catch {
    return "";
  }
}

/** Git Bash, from PATH if it is there and from Git's usual places if it is not. */
export function findBash(platform: string = process.platform): string {
  const onPath = whichSync("bash", platform);
  if (onPath) return onPath;
  for (const candidate of GIT_BASH_FALLBACKS) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      /* an unreadable path is not a bash */
    }
  }
  // Nothing found. Return the bare name so the caller's own error says "bash", which
  // is a thing a reader can act on, rather than EFTYPE, which is not.
  return "bash";
}

export interface ScriptCommand {
  program: string;
  args: string[];
}

/**
 * What to hand `execFile` so that a project script actually runs.
 *
 * Off Windows this changes nothing at all: the script is the program, exactly as
 * before, because the kernel reads its shebang. That is deliberate and is the first
 * thing the tests assert. On Windows the interpreter goes in front:
 *
 *   `.sh`            bash, which is Git Bash, which is already installed because
 *                    BANG.md's block 1 installs it and the reader is typing in it
 *   `.cmd` / `.bat`  cmd.exe /c, which is the only thing that runs a batch file
 *   `.ps1`           powershell -NoProfile -ExecutionPolicy Bypass -File, the same
 *                    form BANG.md's own PowerShell lines use, and for the same
 *                    reason: a cold account is on Restricted
 *
 * Anything else is left alone, because an `.exe` needs no help and a file with no
 * extension is either a real executable or a problem this cannot fix.
 */
export function scriptCommand(
  script: string,
  args: string[] = [],
  platform: string = process.platform,
  bash: () => string = () => findBash(platform),
): ScriptCommand {
  if (platform !== "win32") return { program: script, args };

  switch (path.extname(script).toLowerCase()) {
    case ".sh":
      return { program: bash(), args: [script, ...args] };
    case ".cmd":
    case ".bat":
      return { program: "cmd.exe", args: ["/c", script, ...args] };
    case ".ps1":
      return {
        program: "powershell.exe",
        args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, ...args],
      };
    default:
      return { program: script, args };
  }
}
