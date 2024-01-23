import { group } from 'console';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { Annotation, EditorState, Extension, StateField, Transaction, TransactionSpec } from '@codemirror/state';

// Remember to rename these classes and interfaces!

const ProgramTxn = Annotation.define<boolean>();

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerEditorExtension(EditorState.transactionFilter.of(this.convertFilter));

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'quick-format-selected-nuclide',
			name: 'Quick format selected nuclide',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				let match = editor.getSelection().match("(\\d{1,3})_(\\d{1,3})([A-z]{1,3})");
				console.log(match);
				if (match && match.length == 4){
					editor.replaceSelection(`$^{${match[1]}}_{${match[2]}}${match[3]}$`)
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		
		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
	convertFilter = (tr: Transaction): TransactionSpec | readonly TransactionSpec[] => {
		if (!tr.docChanged || tr.annotation(ProgramTxn)) { return tr; }
		let shouldHijack = true; // Hijack when some rules match all changes
		const changes: TransactionSpec[] = [];
		tr.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
			if (!shouldHijack) { return; }

			console.log(fromA, toA, fromB, toB, inserted);
			if (shouldHijack) { tr = tr.startState.update(...changes); }
			
			
		});

		if (shouldHijack) { tr = tr.startState.update(...changes); }
		return tr;
	};

}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
