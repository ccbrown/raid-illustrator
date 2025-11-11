import type { Metadata } from 'next';

import { Editor } from './_components/Editor';

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

export default function Page() {
    return <Editor />;
}
