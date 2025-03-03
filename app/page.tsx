"use client";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import WORD_LIST from "@/NWL2023_processed.json";

// TODO: Sort bench when updated
// TODO: Show tiles left in banana bag
// TODO: Adjust grid dimensions
// TODO: Fix bench to screen?

const IS_LETTER = /^[a-zA-Z]+$/;
const ARROW_KEYS = new Set(["ARROWLEFT", "ARROWRIGHT", "ARROWUP", "ARROWDOWN"]);
const DELETE_KEYS = new Set(["BACKSPACE", "DELETE"]);
const ROWS = 9;
const COLS = 15;
const BENCH_SIZE = 15;
const EMPTY_TILE = " ";

const LETTER_DISTRIBUTION = {
	2: "JKQXZ",
	3: "BCFHMPVWY",
	4: "G",
	5: "L",
	6: "DSU",
	8: "N",
	9: "TR",
	11: "O",
	12: "I",
	13: "A",
	18: "E",
};
const LETTER_POOL = Object.keys(LETTER_DISTRIBUTION).flatMap((count) => {
	const intCount = Number.parseInt(count);
	let letters: string[] = [];
	for (const char of LETTER_DISTRIBUTION[intCount]) {
		letters = letters.concat(Array(intCount).fill(char));
	}
	return letters;
});

interface Props {
	row: number;
	col: number;
	letter: string;
}

enum Direction {
	Vertical = "Vertical",
	Horizontal = "Horizontal",
}

export default function Game() {
	const [grid, setGrid] = useState(
		Array<string[]>(ROWS).fill(Array(COLS).fill(EMPTY_TILE)),
	);

	const [bench, setBench] = useState<string[]>([]);
	const [selectedTile, setSelectedTile] = useState([-1, -1]);
	const [editDirection, setEditDirection] = useState(Direction.Horizontal);
	const [board_verification, setBoardVerification] = useState<string[]>([]);

	function handleKeyDown(event: KeyboardEvent) {
		const keyPressed = event.key.toUpperCase();
		const [row, col] = selectedTile;

		console.debug(`Key pressed: ${keyPressed}`);

		if (row < 0 || col < 0) {
			return;
		}

		if (IS_LETTER.test(keyPressed) && bench.includes(keyPressed)) {
			// Make copies to prevent undesired behavior
			let newGrid = [...grid];
			const newRow = [...newGrid[row]];
			newRow[col] = keyPressed;
			newGrid[row] = newRow;

			const newBench = [...bench];
			const letter = grid[row][col];
			if (IS_LETTER.test(letter)) {
				newBench[newBench.indexOf(keyPressed)] = letter;
			} else {
				newBench.splice(newBench.indexOf(keyPressed), 1);
			}
			setBench(newBench);

			const newSelectedTile = [...selectedTile];
			switch (editDirection) {
				case Direction.Vertical:
					newSelectedTile[0] += 1;
					if (row === grid.length - 1) {
						newGrid = [...newGrid, Array(COLS).fill(EMPTY_TILE)];
					}
					break;
				case Direction.Horizontal:
					newSelectedTile[1] += 1;
					if (col === grid[0].length - 1) {
						newGrid = newGrid.map((row) => [...row, EMPTY_TILE]);
					}
					break;
			}
			setSelectedTile(newSelectedTile);
			setGrid(newGrid);
		} else if (ARROW_KEYS.has(keyPressed)) {
			const newSelectedTile = [...selectedTile];

			switch (keyPressed) {
				case "ARROWUP":
					newSelectedTile[0] -= 1;
					break;
				case "ARROWDOWN":
					newSelectedTile[0] += 1;
					break;
				case "ARROWLEFT":
					newSelectedTile[1] -= 1;
					break;
				case "ARROWRIGHT":
					newSelectedTile[1] += 1;
					break;
				default:
					break;
			}

			if (
				0 <= newSelectedTile[0] &&
				newSelectedTile[0] < grid.length &&
				0 <= newSelectedTile[1] &&
				newSelectedTile[1] < grid[0].length
			) {
				setSelectedTile(newSelectedTile);
			}
		} else if (DELETE_KEYS.has(keyPressed)) {
			let [deleteRow, deleteCol] = selectedTile;
			if (IS_LETTER.test(grid[row][col])) {
				[deleteRow, deleteCol] = selectedTile;
			} else {
				switch (editDirection) {
					case Direction.Vertical:
						deleteRow = row - 1;
						break;
					case Direction.Horizontal:
						deleteCol = col - 1;
						break;
				}
			}

			if (
				deleteRow >= 0 &&
				deleteCol >= 0 &&
				IS_LETTER.test(grid[deleteRow][deleteCol])
			) {
				const newBench = [...bench, grid[deleteRow][deleteCol]];
				setBench(newBench);

				const newGrid = [...grid];
				const newRow = [...newGrid[deleteRow]];
				newRow[deleteCol] = EMPTY_TILE;
				newGrid[deleteRow] = newRow;
				setGrid(newGrid);
			}

			const newSelectedTile = [...selectedTile];
			switch (editDirection) {
				case Direction.Vertical:
					newSelectedTile[0] -= 1;
					break;
				case Direction.Horizontal:
					newSelectedTile[1] -= 1;
					break;
			}
			if (
				0 <= newSelectedTile[0] &&
				newSelectedTile[0] < grid.length &&
				0 <= newSelectedTile[1] &&
				newSelectedTile[1] < grid[0].length
			) {
				setSelectedTile(newSelectedTile);
			}
		} else if (keyPressed === " ") {
			switch (editDirection) {
				case Direction.Horizontal:
					setEditDirection(Direction.Vertical);
					break;
				case Direction.Vertical:
					setEditDirection(Direction.Horizontal);
					break;
				default:
					break;
			}
		} else if (keyPressed === "ENTER") {
			if (
				bench.length === 0 &&
				board_verification.every((word) => !word.startsWith("⚠️"))
			) {
				setBench(LETTER_POOL.toSorted(() => 0.5 - Math.random()).slice(0, 1));
			}
		}
	}

	useEffect(() => {
		setBench(
			LETTER_POOL.toSorted(() => 0.5 - Math.random()).slice(0, BENCH_SIZE),
		);

		document.addEventListener("keydown", (event) => {
			event.preventDefault();
		});
	}, []);

	useEffect(() => {
		const board_words = [];
		for (const row of grid) {
			const row_string = row.join("");
			const row_words = row_string
				.split(EMPTY_TILE)
				.filter((word) => word.length > 1);

			for (const word of row_words) {
				if (word in WORD_LIST) {
					board_words.push(`${word}: ${WORD_LIST[word]}`);
				} else {
					board_words.push(`⚠️ ${word} is not a valid word!`);
				}
			}
		}

		for (let col_index = 0; col_index < grid[0].length; col_index++) {
			const col = grid.map((row) => row[col_index]);
			const col_string = col.join("");
			const col_words = col_string
				.split(EMPTY_TILE)
				.filter((word) => word.length > 1);

			for (const word of col_words) {
				if (word in WORD_LIST) {
					board_words.push(`${word}: ${WORD_LIST[word]}`);
				} else {
					board_words.push(`⚠️ ${word} is not a valid word!`);
				}
			}
		}

		setBoardVerification(board_words);
	}, [grid]);

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [grid, bench, selectedTile, editDirection]);

	function Tile({ row, col, letter }: Props) {
		const isSelected = selectedTile[0] === row && selectedTile[1] === col;
		const hasLetter = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(letter);
		const bg = isSelected ? "bg-yellow-400" : hasLetter ? "bg-yellow-100" : "";

		return (
			<button
				type="button"
				className={`p-4 ${bg} text-amber-950 font-bold rounded-md text-4xl w-16 h-16 z-10`}
				onClick={() => {
					setSelectedTile([row, col]);
					if (hasLetter) {
						const newGrid = [...grid];
						const newRow = [...newGrid[row]];
						newRow[col] = EMPTY_TILE;
						newGrid[row] = newRow;
						setGrid(newGrid);

						const newBench = [...bench, letter];
						setBench(newBench);
					}
				}}
			>
				{letter}
			</button>
		);
	}

	return (
		<div>
			<div className="w-full place-items-center mb-10 text-center">
				<div className="grid auto-cols-max grid-flow-col gap-2 mb-2">
					{bench.map((letter, index) => (
						<div
							key={index}
							className="p-4 bg-yellow-100 text-amber-950 font-bold rounded-md text-4xl w-16 h-16"
							onClick={() =>
								handleKeyDown(new KeyboardEvent("keydown", { key: letter }))
							}
							onKeyDown={() =>
								handleKeyDown(new KeyboardEvent("keydown", { key: letter }))
							}
						>
							{letter}
						</div>
					))}

					{bench.length === 0 &&
						board_verification.every((word) => !word.startsWith("⚠️")) && (
							<button
								type="button"
								onClick={() =>
									setBench(
										LETTER_POOL.toSorted(() => 0.5 - Math.random()).slice(0, 1),
									)
								}
								className="p-4 bg-yellow-800 text-yellow-300 font-bold rounded-md w-32"
							>
								🍌 Peel!
							</button>
						)}
				</div>
				<span className="font-bold">Bench</span>
				<button
					type="button"
					onClick={() => {
						setBench(
							LETTER_POOL.toSorted(() => 0.5 - Math.random()).slice(
								0,
								BENCH_SIZE,
							),
						);
					}}
					className="bg-amber-300 text-black mx-4 rounded-sm py-1 px-2"
				>
					Reset bench
				</button>
			</div>

			<div className="w-full justify-center flex flex-row mb-4 gap-4 divide-slate-500 divide-x-2">
				<div className="px-4">
					<b>Use mouse to select tiles and keyboard to interact:</b>
					<ul className="list-disc list-inside">
						<li>Type letters to use letters from bench</li>
						<li>Arrow keys to move selected tile</li>
						<li>Backspace/delete to clear selected tile</li>
						<li>Spacebar to control edit direction (horizontal/vertical)</li>
						<li>Enter to peel when your board is complete!</li>
						<li>WIP: Right click to exchange tile</li>
						<li>WIP: Hold shift to allow selecting multiple letters</li>
						<li>WIP: Hold alt to allow moving multiple letters</li>
						<li>WIP: Hold ctrl to swap tiles</li>
					</ul>
				</div>
				<div className="px-4">
					<b>Board words:</b>
					<br />
					<ul className="list-disc list-inside">
						{board_verification.map((board_word) => (
							<li key={board_word}>{board_word}</li>
						))}
						{board_verification.length === 0 &&
							"Fill the board with some words!"}
					</ul>
				</div>
			</div>

			<div className="w-full place-items-center">
				<div
					className={`grid auto-rows-max grid-flow-row divide-y-3 divide-gray-500 `}
				>
					{grid.map((row, row_index) => (
						<div
							key={row_index}
							className={cn(
								"grid auto-cols-max grid-flow-col divide-x-3 divide-gray-500",
								selectedTile[0] === row_index &&
									editDirection === Direction.Horizontal &&
									"bg-neutral-700 opacity-90",
							)}
						>
							{row.map((col, col_index) => (
								<div
									key={`${row_index}_${col_index}`}
									className={cn(
										selectedTile[1] === col_index &&
											editDirection === Direction.Vertical &&
											"bg-neutral-700 opacity-90",
									)}
								>
									<Tile row={row_index} col={col_index} letter={col} />
								</div>
							))}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
