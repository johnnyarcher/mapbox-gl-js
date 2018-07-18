// @flow

import { NumberType, ValueType, FormattedType } from '../types';


import type { Expression } from '../expression';
import type EvaluationContext from '../evaluation_context';
import type ParsingContext from '../parsing_context';
import type { Type } from '../types';

export class FormattedSection {
    text: string
    scale: number | null
    fontStack: string | null

    constructor(text: string, scale: number | null, fontStack: string | null) {
        this.text = text;
        this.scale = scale;
        this.fontStack = fontStack;
    }
}

export class Formatted {
    sections: Array<FormattedSection>

    constructor(sections: Array<FormattedSection>) {
        this.sections = sections;
    }

    toString(): string {
        return this.sections.map(section => section.text).join();
    }
}

export class FormattedExpression implements Expression {
    type: Type;
    text: Expression;
    scale: Expression | null;
    font: Expression | null;

    constructor(text: Expression, scale: Expression | null, font: Expression | null) {
        this.type = FormattedType;
        this.text = text;
        this.scale = scale;
        this.font = font;
    }

    static parse(args: Array<mixed>, context: ParsingContext): ?Expression {
        if (args.length !== 3)
            return context.error(`Expected two arguments.`);

        const text = context.parse(args[1], 1, ValueType);
        if (!text) return null;
        const kind = text.type.kind;
        if (kind !== 'string' && kind !== 'value' && kind !== 'null')
            return context.error(`Formatted text type must be 'string', 'value', or 'null'.`);

        const options = (args[2]: any);
        if (typeof options !== "object" || Array.isArray(options))
            return context.error(`Format options argument must be an object.`);

        let scale = null;
        if (options['font-scale']) {
            scale = context.parse(options['font-scale'], 1, NumberType);
            if (!scale) return null;
        }

        let font = null;
        if (options['text-font']) {
            font = context.parse(options['text-font'], 1, ValueType); // Require array of strings?
            if (!font) return null;
        }

        return new FormattedExpression(text, scale, font);
    }

    evaluate(ctx: EvaluationContext) {
        return new Formatted([
            new FormattedSection(
                this.text.evaluate(ctx),
                this.scale ? this.scale.evaluate(ctx) : null,
                this.font ? this.font.evaluate(ctx).join(',') : null
            )
        ]);
    }

    eachChild(fn: (Expression) => void) {
        fn(this.text);
        if (this.scale) {
            fn(this.scale);
        }
        if (this.font) {
            fn(this.font);
        }
    }

    possibleOutputs() {
        // TODO: think about right answer here
        return [undefined];
    }

    serialize() {
        const options = {};
        if (this.scale) {
            options['font-scale'] = this.scale.serialize();
        }
        if (this.font) {
            options['text-font'] = this.font.serialize();
        }
        return ["formatted", this.text.serialize(), options];
    }
}
