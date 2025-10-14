import { CloseButton, Field, Label, Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { CaretDownIcon } from '@phosphor-icons/react';

interface Option {
    label: string;
    key: string;
}

interface Props {
    options: Option[];
    label?: string;
    disabled?: boolean;

    selectedOptionKey?: string;
    onChange: (option: Option) => void;
}

export const Dropdown = (props: Props) => {
    return (
        <Field className="flex flex-row items-center gap-2">
            {props.label && <Label className="text-white/60 text-xs whitespace-nowrap">{props.label}</Label>}
            <Popover>
                <PopoverButton
                    disabled={props.disabled}
                    className={`inline-flex items-center gap-2 bg-black/20 rounded-xs py-0.5 px-2 focus:outline-none data-[focus]:outline-1 data-[focus]:outline-cyan-500 ${props.disabled ? 'cursor-default text-white/50' : 'cursor-pointer'}`}
                >
                    <div className="text-xs">
                        {props.options.find((opt) => opt.key === props.selectedOptionKey)?.label}
                    </div>
                    <CaretDownIcon size={14} />
                </PopoverButton>

                <PopoverPanel anchor="bottom" className="flex flex-col bg-elevation-3 shadow-md rounded-lg mt-1">
                    <div className="flex flex-col max-h-[80vh] overflow-auto">
                        {props.options.map((option) => (
                            <CloseButton
                                key={option.key}
                                className="flex flex-row px-2 py-0.5 hover:bg-white/10 cursor-pointer justify-start"
                                onClick={() => {
                                    props.onChange(option);
                                }}
                            >
                                <div className="text-xs">{option.label}</div>
                            </CloseButton>
                        ))}
                    </div>
                </PopoverPanel>
            </Popover>
        </Field>
    );
};
