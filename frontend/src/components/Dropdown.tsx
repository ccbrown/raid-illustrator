import { CaretDownIcon } from '@phosphor-icons/react';
import { CloseButton, Field, Label, Popover, PopoverButton, PopoverPanel } from '@headlessui/react';

interface Option {
    label: string;
    key: string;
}

interface Props {
    options: Option[];
    label?: string;

    selectedOptionKey?: string;
    onChange: (option: Option) => void;
}

export const Dropdown = (props: Props) => {
    return (
        <Field className="grow">
            <div className="flex text-sm">
                {props.label && <Label className="block leading-6 font-semibold">{props.label}</Label>}
            </div>
            <Popover>
                <PopoverButton className="inline-flex items-center gap-2 bg-black/20 rounded-full mt-1 py-1.5 px-3 cursor-pointer focus:outline-none data-[focus]:outline-1 data-[focus]:outline-cyan-500">
                    <div className="text-sm/6">
                        {props.options.find((opt) => opt.key === props.selectedOptionKey)?.label}
                    </div>
                    <CaretDownIcon size={14} />
                </PopoverButton>

                <PopoverPanel anchor="bottom" className="flex flex-col bg-elevation-3 shadow-md rounded-lg mt-1">
                    <div className="flex flex-col max-h-[80vh] overflow-auto">
                        {props.options.map((option) => (
                            <CloseButton
                                key={option.key}
                                className="flex flex-row px-4 py-0.5 hover:bg-white/10 cursor-pointer justify-start"
                                onClick={() => {
                                    props.onChange(option);
                                }}
                            >
                                <div className="text-sm/6">{option.label}</div>
                            </CloseButton>
                        ))}
                    </div>
                </PopoverPanel>
            </Popover>
        </Field>
    );
};
