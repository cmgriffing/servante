"use strict";

// Node deps
const path = require("path");
const fs = require("fs-extra");
const mustache = require("mustache");
const glob = require("glob");

// React deps
const React = require("react");
const { useState } = React;
const PropTypes = require("prop-types");

// Ink deps
const { Text, Color, Static, Box } = require("ink");
const Gradient = require("ink-gradient");
const BigText = require("ink-big-text");
const SelectInput = require("ink-select-input").default;
const InkBox = require("ink-box");
const TextInput = require("ink-text-input").UncontrolledTextInput;

const Spinner = require("ink-spinner").default;

// --------------------------------------------------
// Load servante plugins
const plugins = loadPlugins();
const formatSets = extractOptions(plugins);
// --------------------------------------------------

// --------------------------------------------------
// Select Random Spinner Key for each invocation
const cliSpinners = require("cli-spinners");
const cliSpinnerKeys = Object.keys(cliSpinners);
const currentSpinner =
	cliSpinnerKeys[Math.floor(Math.random() * cliSpinnerKeys.length)];
// --------------------------------------------------

mustache.templateCache = undefined;

const App = ({ name }) => {
	const [selectedInputFormat, setSelectedInputFormat] = useState(null);
	const [selectedOutputFormat, setSelectedOutputFormat] = useState(null);
	const [finished, setFinished] = useState(false);
	const [projectName, setProjectName] = useState("");
	const [projectPath, setProjectPath] = useState("");
	const [projectNameSelected, setProjectNameSelected] = useState(false);
	const [projectPathSelected, setProjectPathSelected] = useState(false);

	const defaultProjectName = "example-presentation";
	const defaultProjectPath = `./${projectName}`;

	const handleProjectNameSubmit = name => {
		setProjectName(name || defaultProjectName);
		setProjectNameSelected(true);
	};
	const handleProjectPathSubmit = path => {
		setProjectPath(path || defaultProjectPath);
		setProjectPathSelected(true);
	};

	const handleOutputFormatSelect = async item => {
		setSelectedOutputFormat(item);
		// kick off file creation
		await startScaffoldingFileStructure({
			projectName,
			projectPath,
			selectedInputFormat,
			selectedOutputFormat: item
		});

		//setTimeout(() => {
		// and when done,  exit
		setFinished(true);
		process.exit();
		//}, 3000);
	};

	return (
		<>
			<Static>
				<Gradient name="mind">
					<BigText align="center" text="Servante" font="huge" />
				</Gradient>
				<InkBox
					borderStyle="round"
					borderColor="cyan"
					float="center"
					padding={1}
				>
					Servante is a presentation scaffolding tool. Use:{" "}
					<Color color="magenta">"servante --help"</Color> for instructions.
				</InkBox>
			</Static>
			{!projectNameSelected && (
				<Box>
					<Box marginRight={1}>Project Name:</Box>
					<TextInput
						placeholder={defaultProjectName}
						value={projectName}
						onSubmit={handleProjectNameSubmit}
					/>
				</Box>
			)}
			{projectNameSelected && (
				<Box>
					<Box marginRight={1}>Project Name:</Box>
					<Text>
						<Color green>{projectName}</Color>
					</Text>
				</Box>
			)}
			{projectNameSelected && !projectPathSelected && (
				<Box>
					<Box marginRight={1}>Project Path:</Box>
					<TextInput
						placeholder={defaultProjectPath}
						value={projectPath}
						onSubmit={handleProjectPathSubmit}
					/>
				</Box>
			)}
			{projectNameSelected && projectPathSelected && (
				<Box>
					<Box marginRight={1}>Project Path:</Box>
					<Text>
						<Color green>{projectPath}</Color>
					</Text>
				</Box>
			)}
			{projectName && projectPath && (
				<>
					<Text>Select an Input format:</Text>
					<SelectInput
						items={formatSets.inputFormats}
						onSelect={setSelectedInputFormat}
					/>
				</>
			)}
			{selectedInputFormat && (
				<>
					<Text>Select an Output format:</Text>
					<SelectInput
						items={selectedInputFormat.children}
						onSelect={handleOutputFormatSelect}
					/>
				</>
			)}
			{selectedOutputFormat && (
				<>
					<Box justifyContent="flex-start">
						<Box margin={2}>
							<Color green>
								<Spinner type={currentSpinner} />
							</Color>
							<Color green>
								<Spinner type={currentSpinner} />
							</Color>
							<Color green>
								<Spinner type={currentSpinner} />
							</Color>
						</Box>
						<Box marginTop={2} marginBottom={2}>
							<Text>Scaffolding Project</Text>
						</Box>
						<Box margin={2}>
							<Color green>
								<Spinner type={currentSpinner} />
							</Color>
							<Color green>
								<Spinner type={currentSpinner} />
							</Color>
							<Color green>
								<Spinner type={currentSpinner} />
							</Color>
						</Box>
					</Box>
				</>
			)}
			{finished && (
				<>
					<Text>All done. :)</Text>
				</>
			)}
		</>
	);
};

App.getDerivedStateFromError = function(error) {
	// Update state so the next render will show the fallback UI.
	// console.log({ error });
	return { hasError: true };
};

module.exports = App;

function loadPlugins() {
	const pluginJsonFiles = glob.sync(
		path.resolve(__dirname, "./plugins/**/plugin.json")
	);
	const loadedPlugins = pluginJsonFiles.map(filePath =>
		JSON.parse(fs.readFileSync(filePath, { encoding: "utf-8" }))
	);
	return loadedPlugins;
}

function extractOptions(plugins) {
	const formatSets = plugins.reduce(
		(accumulator, plugin) => {
			const existingInputType = accumulator.inputFormats.find(
				inputFormat => inputFormat.label === plugin.pluginType
			);
			if (!existingInputType) {
				accumulator.inputFormats.push({
					label: plugin.pluginType,
					value: plugin.pluginType,
					children: [
						{
							...plugin,
							label: plugin.displayName,
							value: plugin.name
						}
					]
				});
			} else {
				existingInputType.children.push(plugin);
			}
			return accumulator;
		},
		{
			inputFormats: []
		}
	);

	return formatSets;
}

async function startScaffoldingFileStructure(inputResults) {
	// coerce projectPath
	const projectPath = path.resolve(inputResults.projectPath);

	// get plugin path
	const pluginPath = path.resolve(
		__dirname,
		`plugins/${inputResults.selectedInputFormat.value}/${inputResults.selectedOutputFormat.value}/templates/init`
	);

	// read files from plugin path
	return Promise.all(
		glob.sync(`${pluginPath}/**/*`, { nodir: true }).map(async filePath => {
			const relativeFilePath = filePath.slice(pluginPath.length);
			const newFilePath = `${projectPath}${relativeFilePath}`;
			await fs.ensureFile(newFilePath);

			if (
				![
					".gif",
					".jpg",
					".jpeg",
					".bmp",
					".png",
					".eot",
					".ttf",
					".woff",
					".woff2",
					".wav",
					".pdf"
				].includes(path.extname(filePath))
			) {
				const interpolatedFileContents = mustache.render(
					await fs.readFile(filePath, { encoding: "utf-8" }),
					{
						name: inputResults.projectName
					},
					{},
					["<%%", "%%>"]
				);
				await fs.writeFile(newFilePath, interpolatedFileContents);
			} else {
				const fileContents = await fs.readFile(filePath);
				await fs.writeFile(newFilePath, fileContents);
			}
		})
	);
}
