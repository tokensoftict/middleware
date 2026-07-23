import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(
    props: ImgHTMLAttributes<HTMLImageElement>,
) {
    return (
        <img
            src="https://upperlink.ng/assets/footer/pageiconx.PNG"
            alt="Upperlink Logo"
            {...props}
        />
    );
}
