import React, { useState } from "react";
import { DotButton, useDotButton } from "./EmblaCarouselDotButton";
import {
  PrevButton,
  NextButton,
  usePrevNextButtons,
} from "./EmblaCarouselArrowButtons";
import useEmblaCarousel from "embla-carousel-react";

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Download from "yet-another-react-lightbox/plugins/download";

import downloadIconDark from "../icons/download-dark-theme.svg";
import downloadIconLight from "../icons/download-light-theme.svg";

export function EmblaCarousel({ children, images, url, ...props }) {
  const { slides, options } = props;
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [index, setIndex] = useState(6);

  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);
  const [open, setOpen] = useState(false);

  function onButtonClick() {
    // const pdfUrl = `../../public/content/document/${url}.pdf`;
    const pdfUrl = `content/document/${url}.pdf`;
    // const pdfUrl = `content/document/${url}.pdf`;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${url}.pdf`; // specify the filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  return (
    <>
      <section className="embla">
        <div className="embla__controls justify-end">
          <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
        </div>
        <div className="embla__viewport" ref={emblaRef}>
          <div className="embla__container">
            {images.map((image, index) => (
              <button
                onClick={() => {
                  setIndex(index);
                  setOpen(true);
                }}
                className="embla__slide"
                key={image.src}
              >
                <img src={image.src} alt="ss" />
              </button>
            ))}
          </div>
        </div>
        <div className="embla__controls">
          <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
        </div>
      </section>
      <div className="embla__controls">
        <button onClick={onButtonClick} className="text-md flex flex-row gap-2">
          <p className="dark:text-zinc-300 hover:font-semibold text-zinc-700">
            Download PDF
          </p>
          <img
            src={downloadIconDark.src}
            alt="img"
            width={20}
            className="hidden dark:block zinc-"
          />
          <img
            src={downloadIconLight.src}
            alt="img"
            width={20}
            className="block dark:hidden"
          />
        </button>

        <div className="embla__dots">
          {scrollSnaps.map((_, index) => (
            <DotButton
              key={index}
              onClick={() => onDotButtonClick(index)}
              className={"embla__dot".concat(
                index === selectedIndex ? " embla__dot--selected" : "",
              )}
            />
          ))}
        </div>
      </div>
      <Lightbox
        open={open}
        index={index}
        on={{ view: ({ index: currentIndex }) => setIndex(currentIndex) }}
        close={() => setOpen(false)}
        slides={images.map((item) => ({ src: item.src }))}
        plugins={[Download]}
      />
    </>
  );
}

export default EmblaCarousel;
