import type { FormEvent } from "react";
import Select, { type SingleValue } from "react-select";

type Option = {
  value: string;
  label: string;
};

type VideoSearchBarProps = {
  tags: Option[];
  selectedOption: SingleValue<Option>;
  searchTerm: string;
  onTagChange: (selected: SingleValue<Option>) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSearchTermChange: (value: string) => void;
};

export default function VideoSearchBar({
  tags,
  selectedOption,
  searchTerm,
  onTagChange,
  onSearchSubmit,
  onSearchTermChange,
}: VideoSearchBarProps) {
  return (
    <div className="search-bar">
      <h1>Notes</h1>

      <div className="notes-filter">
        <div className="tag-search">
          <Select
            options={tags}
            value={selectedOption}
            onChange={onTagChange}
            placeholder="Choose a tag..."
          />
        </div>

        <form className="notes-search" onSubmit={onSearchSubmit}>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search videos generally..."
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
