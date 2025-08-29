import {
  Command as BaseCommand,
  Help,
  Option,
} from "commander";

export class GroupedOption extends Option {
  private _group?: string;
  group(): string | undefined;
  group(group: string): typeof this;
  group(group?: string): typeof this | string | undefined {
    if (group !== undefined) {
      this._group = group;
      return this;
    }
    return this._group;
  }
}

export class FieldValueOption extends GroupedOption {
  constructor(flags: string, description?: string) {
    super(flags, description);
    this.conflicts("json").group("Non-Steam Game Options");
  }
}

export class ImageOption extends GroupedOption {
  constructor(flags: string, description?: string) {
    super(flags, description);
    this.group("Image Options");
  }
}

export class ConfigOption extends GroupedOption {}

export class GroupedOptionsHelp extends Help {
  helpWidth = 80;
  
  formatHelp(cmd: Command, helper: Help): string {
    const termWidth = helper.padWidth(cmd, helper);

    function callFormatItem(term: string, description: string) {
      return helper.formatItem(term, termWidth, description, helper);
    }

    const UNCATEGORIZED_KEY = "__uncategorized__";
    const optionGroups: Record<string, Array<Option>> = {};

    const base = super.formatHelp(cmd, helper);
    const { index } = base.match(/\nOptions:/)!;
    let output = [base.slice(0, index)];

    for (const opt of (helper.visibleOptions(cmd) as Array<GroupedOption>)) {
      const group = opt.group ? opt.group() || UNCATEGORIZED_KEY : UNCATEGORIZED_KEY;
      if (!optionGroups[group]) {
        optionGroups[group] = [];
      }
      optionGroups[group].push(opt);
    }

    for (const [group, opts] of Object.entries(optionGroups)) {
      const optionList = opts.map((option) => {
        return callFormatItem(
          helper.styleOptionTerm(helper.optionTerm(option)),
          helper.styleOptionDescription(helper.optionDescription(option)),
        );
      });
      if (optionList.length > 0) {
        output = output.concat([
          helper.styleTitle(`${group === UNCATEGORIZED_KEY ? "Options" : group}:`),
          ...optionList,
          '',
        ]);
      }
    }

    return output.join("\n");
  }
}

export class Command extends BaseCommand {
  _usage?: string;
  _helpOption?: string | boolean;

  constructor(name: string) {
    super(name);
  }

  usage(): string;
  usage(str: string): this;
  usage(str?: string): string | this {
    if (str === undefined) {
      if (this._usage) return this._usage;

      const args = this.registeredArguments.map((arg) => {
        const nameOutput = arg.name() + (arg.variadic === true ? '...' : '');
        return arg.required ? '<' + nameOutput + '>' : '[' + nameOutput + ']';
      });
      return ([] as Array<string>)
        .concat(
          this.commands.length ? '[command]' : [],
          this.registeredArguments.length ? args : [],
          this.options.length || this._helpOption !== null ? '[options]' : [],
        )
        .join(' ');
    }

    this._usage = str;
    return this;
  }

  addOptions(options: Array<Option>) {
    options.forEach(option => {
      this.addOption(option);
    });
    return this;
  }

  createHelp() {
    return new GroupedOptionsHelp();
  }
}
