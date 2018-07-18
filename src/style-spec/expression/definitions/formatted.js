// @flow

import { NumberType, ValueType, FormattedType, ArrayType } from '../types';

import type { Expression } from '../expression';
import type EvaluationContext from '../evaluation_context';
import type ParsingContext from '../parsing_context';
import type { Type } from '../types';

export class FormattedSection {
    text: string
    size: number | null
    fontStack: string | null

    constructor(text: string, size: number | null, fontStack: string | null) {
        this.text = text;
        this.size = size;
        this.fontStack = fontStack;
    }
}

export class Formatted {
    sections: [FormattedSection]

    constructor(sections: [FormattedSection]) {
        this.sections = sections;
    }

    toString(): string {
        return this.sections.map(section => section.text).join();
    }
}

export class FormattedExpression implements Expression {
    type: Type;
    text: Expression;
    size: Expression | null;
    font: Expression | null;

    constructor(text: Expression, size: Expression | null, font: Expression | null) {
        this.type = FormattedType;
        this.text = text;
        this.size = size;
        this.font = font;
    }

    static parse(args: Array<mixed>, context: ParsingContext): ?Expression {
        if (args.length !== 3)
            return context.error(`Expected two arguments.`);

        const text = context.parse(args[1], 1, ValueType);
        if (!text) return null;
        if (text.type !== 'string' && text.type !== 'value' && text.type !== 'null')
            return context.error(`Formatted text type must be 'string', 'value', or 'null'.`);

        const options = (args[2]: any);
        if (typeof options !== "object" || Array.isArray(options))
            return context.error(`Format options argument must be an object.`);

        let size = null;
        if (options['text-size']) {
            size = context.parse(options['text-size'], 1, NumberType); // What about zoom-dependent expressions?
            if (!size) return null;
        }

        let font = null;
        if (options['text-font']) {
            font = context.parse(options['text-font'], 1, ArrayType); // Require array of strings?
            if (!font) return null;
        }

        return new FormattedExpression(text, size, font);
    }

    evaluate(ctx: EvaluationContext) {
        return new Formatted([
            new FormattedSection(
                this.text.evaluate(ctx),
                this.size ? this.size.evaluate(ctx) : null,
                this.font ? this.font.evaluate(ctx).join(',') : null
            )
        ]);
    }

    eachChild(fn: (Expression) => void) {
        fn(this.text);
        if (this.size) {
            fn(this.siz);
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
        if (this.size) {
            options['text-size'] = this.size.serialize();
        }
        if (this.font) {
            options['text-font'] = this.font.serialize();
        }
        return ["formatted", this.text.serialize(), options];
    }
}
