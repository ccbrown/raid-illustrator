import type { Metadata } from 'next';

import { Editor } from './_components/Editor';

export const metadata: Metadata = {
    title: {
        // the title is set dynamically by the Editor component
        absolute: '',
    },
    robots: {
        index: false,
        follow: false,
    },
};

export default function Page() {
    return <Editor />;
}
