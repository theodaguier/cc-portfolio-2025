import { urlFor } from "@/lib/sanity";
import { getUniqueVideoKey, getVideoUrl, isVideo } from "@/utils/video";
import clsx from "clsx";
import type { Projects } from "studio/sanity.types";
import { Image } from "./image";

// Simple scroll to project function
const scrollToProject = (projectId: string): void => {
	const projectElement = document.querySelector(
		`[data-project-id="${projectId}"]`,
	);
	if (projectElement) {
		projectElement.scrollIntoView({
			behavior: "smooth",
			block: "center",
		});
	}
};

// Define AspectRatio type to match the one in Image component
type AspectRatio = "16/9" | "4/3" | "1/1" | "3/4" | "9/16" | "4/5";

export const Thumbnail = ({
	item,
	className,
	ratio = "4/5",
	src,
}: {
	item: Projects;
	className?: string;
	ratio?: AspectRatio;
	src?: string;
}) => {
	if (!item?._id) {
		return null;
	}

	const handleClick = () => {
		const projectId = item.slug?.current || item._id;
		if (projectId) {
			scrollToProject(projectId);
		}
	};

	const getMediaUrl = () => {
		// Use provided src if available
		if (src) return src;

		// Handle cases where thumbnail is undefined
		if (!item.thumbnail) return "";

		try {
			// Handle case where thumbnail is an array (as per schema)
			if (Array.isArray(item.thumbnail)) {
				// Find the first video or image in the array
				const mediaItem = item.thumbnail.find(
					(t) => t && typeof t === "object",
				);
				if (!mediaItem) return "";

				// Debug info
				console.log("Array thumbnail found, first item:", mediaItem);

				if (isVideo(mediaItem)) {
					// Handle video URL for array item
					const videoRef = mediaItem.asset?._ref;
					if (!videoRef) return "";

					console.log("Video asset ref in array:", videoRef);

					return getVideoUrl(videoRef);
				}

				// Otherwise use Sanity's transformation API for images
				return urlFor(mediaItem).url();
			}

			// Handle non-array case (direct thumbnail object)
			if (isVideo(item.thumbnail)) {
				// Debug info
				console.log("Video thumbnail detected:", item.thumbnail);
				console.log("Asset ref:", item.thumbnail.asset?._ref);

				// Extract the reference
				const videoRef = item.thumbnail.asset?._ref;
				if (!videoRef) return "";

				// Handle video URL
				return getVideoUrl(videoRef);
			}
			// Use Sanity's transformation API for images
			return urlFor(item.thumbnail).url();
		} catch (error) {
			console.warn("Error generating media URL:", error);
			return "";
		}
	};

	// Get the actual thumbnail to check if it's a video
	const getActualThumbnail = () => {
		if (Array.isArray(item.thumbnail)) {
			return item.thumbnail.find((t) => t && typeof t === "object") || null;
		}
		return item.thumbnail || null;
	};

	const thumbnail = getActualThumbnail();
	const isVideoThumbnail = isVideo(thumbnail);
	const mediaUrl = getMediaUrl();

	// Generate a unique key for this video element to avoid React key duplications
	const videoKey = isVideoThumbnail
		? getUniqueVideoKey(thumbnail, item._id)
		: `video-${item._id}`;

	return (
		<button
			type="button"
			onClick={handleClick}
			className="block size-full cursor-pointer"
		>
			<div className="relative size-full" style={{ aspectRatio: ratio }}>
				{isVideoThumbnail ? (
					<>
						<video
							key={videoKey}
							className={clsx(
								className,
								"absolute inset-0 bg-white object-cover transition-opacity duration-500",
							)}
							src={mediaUrl}
							autoPlay
							loop
							muted
							playsInline
							draggable={false}
							onError={(e) => console.error("Video loading error:", e)}
						>
							<track kind="captions" />
						</video>
						{!mediaUrl && (
							<div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-500 transition-opacity duration-500">
								Video URL missing
							</div>
						)}
					</>
				) : (
					<Image
						className={clsx(
							className,
							"h-full w-full object-cover transition-opacity duration-500",
						)}
						ratio={ratio}
						src={mediaUrl}
						alt={item.title || "Thumbnail"}
						draggable={false}
					/>
				)}
			</div>
		</button>
	);
};
