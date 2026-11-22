const CUSTOM_EVENT_COLORS = [
	"red",
	"orange",
	"yellow",
	"green",
	"cyan",
	"blue",
	"purple",
	"pink",
] as const;

export type TCustomEventColor = (typeof CUSTOM_EVENT_COLORS)[number];

export function isCustomEventColor(value: unknown): value is TCustomEventColor {
	return CUSTOM_EVENT_COLORS.some((color) => color === value);
}
