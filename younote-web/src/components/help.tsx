// import { Images } from '../assets/images';

type render<T> = {
    title: string;
    subtitle: string;
    typeKey: string;
    items: T[];
    emptyText: string;
    renderItem: (item: T) => React.ReactNode;
    onSeeAll: (type: string) => void;    
    onItemClick: (id: string) => void;  
    placeholderImage: string;  
}

export function renderSection<T>({
    title,
    subtitle,
    typeKey,
    items,
    emptyText,
    renderItem,
    onSeeAll,
    onItemClick,
    placeholderImage
}: render<T>) {
    return (
        <div className="db-box">
            <div className={`${typeKey}-text`}>
                <div className="sep">
                    <h2 id={`${typeKey}-subt`}>{title}</h2>
                    <p id={`${typeKey}-note`}>{subtitle}</p>
                </div>
                <h3 className="see-all-link" onClick={() => onSeeAll(typeKey)}>
                    See all →
                </h3>
            </div>
            <hr className="dash-line" />
            <div className={`${typeKey}-box`} id={`${typeKey}-box`}>
                {items.length > 0 ? (
                    items.map(renderItem)
                ) : (
                    [1, 2, 3, 4].map((i) => (
                        <div 
                            key={i} 
                            className={`${typeKey.substring(0, 3)}-box`} 
                            onClick={() => onItemClick(`~${i}~`)}
                        >
                            <p>{emptyText}</p>
                            <div><img src={placeholderImage} alt="placeholder" /></div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}