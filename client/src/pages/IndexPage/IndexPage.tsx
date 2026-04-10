import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button/Button";
import "./IndexPage.scss";

type FloatingPhoto = {
    id: number;
    url: string;
    size: number;
    left: number;
    top: number;
    visible: boolean;
};

const photosList = [
    "https://i.redd.it/3yzvxoky9rqf1.jpeg",
    "https://i.redd.it/efyfokgqbrqf1.jpeg",
    "https://i.redd.it/pf1glvcxkrqf1.jpeg",
    "https://i.redd.it/49ig54r7ywqf1.jpeg",
    "https://i.redd.it/kca84fgo1zqf1.jpeg",
    "https://i.redd.it/a9o22nlbc2rf1.jpeg",
    "https://i.redd.it/t7lsd70huhrf1.jpeg",
    "https://i.redd.it/pijosj0ejkrf1.jpeg",
    "https://i.redd.it/3a9pyzejoqrf1.jpeg",
    "https://i.redd.it/13hel5g8axrf1.png",
] as const;

function randomRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export default function HomePage() {
    const [photos, setPhotos] = useState<FloatingPhoto[]>([]);
    const nextIdRef = useRef(0);

    useEffect(() => {
        const timeouts: number[] = [];
        const intervals: number[] = [];

        const setPhotoVisible = (id: number, visible: boolean) => {
            setPhotos((prev) => prev.map((photo) => (photo.id === id ? { ...photo, visible } : photo)));
        };

        const removePhoto = (id: number) => {
            setPhotos((prev) => prev.filter((photo) => photo.id !== id));
        };

        const createPhoto = () => {
            const id = nextIdRef.current++;
            const photo: FloatingPhoto = {
                id,
                url: photosList[Math.floor(Math.random() * photosList.length)],
                size: Math.floor(randomRange(80, 220)),
                left: randomRange(0, 90),
                top: randomRange(0, 85),
                visible: false,
            };

            setPhotos((prev) => [...prev, photo]);

            const appearDelay = randomRange(0, 2000);
            const visibleDuration = randomRange(2000, 5000);

            const appearTimeout = window.setTimeout(() => {
                setPhotoVisible(id, true);

                const hideTimeout = window.setTimeout(() => {
                    setPhotoVisible(id, false);

                    const removeTimeout = window.setTimeout(() => {
                        removePhoto(id);
                    }, 500);

                    timeouts.push(removeTimeout);
                }, visibleDuration);

                timeouts.push(hideTimeout);
            }, appearDelay);

            timeouts.push(appearTimeout);
        };

        const createBatch = () => {
            const count = Math.floor(randomRange(2, 6));
            for (let i = 0; i < count; i++) {
                createPhoto();
            }
        };

        createBatch();

        const flowInterval = window.setInterval(() => {
            createBatch();

            if (Math.random() > 0.6) {
                const extraTimeout = window.setTimeout(() => createPhoto(), 500);
                timeouts.push(extraTimeout);
            }
        }, 4000);

        const randomInterval = window.setInterval(() => {
            if (Math.random() > 0.7) {
                createPhoto();
            }
        }, 2000);

        intervals.push(flowInterval, randomInterval);

        return () => {
            intervals.forEach((intervalId) => window.clearInterval(intervalId));
            timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
            setPhotos([]);
        };
    }, []);

    return (
        <main>
            <div
                className="floating-photos"
                id="floatingPhotosContainer">
                {photos.map((photo) => (
                    <div
                        key={photo.id}
                        className={`photo-item ${photo.visible ? "visible" : ""}`}
                        style={{
                            width: `${photo.size}px`,
                            height: `${photo.size}px`,
                            left: `${photo.left}%`,
                            top: `${photo.top}%`,
                        }}>
                        <img
                            src={photo.url}
                            alt="decorative photo"
                            loading="eager"
                        />
                    </div>
                ))}
            </div>
            <section className="hero">
                <div className="content">
                    <h1>Compairy</h1>
                    <p>
                        Кого выберешь ты? Мы показали 100 людям две фотографии и спросили:{" "}
                        <span className="highlight">Кто тупее?</span> <br></br>А теперь угадай, кого выбрало
                        большинство.
                    </p>
                    <Link to="/themes">
                        <Button>Играть</Button>
                    </Link>
                </div>
            </section>
        </main>
    );
}
