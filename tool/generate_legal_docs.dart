import 'dart:io';

import 'package:yaml/yaml.dart';

const Map<String, String> _canonicalRedirects = <String, String>{
  'privacy': 'en',
  'terms': 'en',
  'tokusho': 'ja',
  'outbound-data': 'en',
};

/// Generates legal documents for Flutter assets and GitHub Pages from a
/// single master YAML source located at `legal/master/legal_documents.yaml`.
void main(List<String> args) {
  final sourceFile = File('legal/master/legal_documents.yaml');
  if (!sourceFile.existsSync()) {
    stderr.writeln('Source data not found: ${sourceFile.path}');
    exitCode = 1;
    return;
  }

  final yaml = loadYaml(sourceFile.readAsStringSync());
  if (yaml is! YamlMap || yaml['documents'] is! YamlList) {
    stderr.writeln('Invalid master format. Expecting documents list.');
    exitCode = 1;
    return;
  }

  final documents = yaml['documents'] as YamlList;
  var generatedCount = 0;
  for (final docNode in documents) {
    if (docNode is! YamlMap) continue;
    final id = docNode['id']?.toString();
    final locales = docNode['locales'];
    if (id == null || locales is! YamlMap) {
      stderr.writeln('Skipping malformed document entry: $docNode');
      continue;
    }

    final slug = id.replaceAll('_', '-');
    for (final localeEntry in locales.entries) {
      final locale = localeEntry.key.toString();
      final body = localeEntry.value?.toString() ?? '';
      _writeFlutterAsset(id, locale, body);
      _writeDocsPage(id, slug, locale, body);
      generatedCount++;
    }
  }

  final redirectCount = _generateCanonicalRedirects();
  stdout.writeln(
    'Generated $generatedCount files from ${documents.length} master documents.',
  );
  if (redirectCount > 0) {
    stdout.writeln('Generated $redirectCount canonical redirect pages.');
  }
}

void _writeFlutterAsset(String id, String locale, String body) {
  final output = File('assets/legal/$locale/$id.md');
  output.parent.createSync(recursive: true);
  final normalized = _ensureTerminalNewline(body);
  output.writeAsStringSync(normalized);
}

void _writeDocsPage(String id, String slug, String locale, String body) {
  final output = File('docs/legal/$locale/$slug.md');
  output.parent.createSync(recursive: true);

  final title = _extractTitle(body) ?? id;
  final frontMatter = [
    '---',
    'layout: default',
    'title: $title',
    'lang: $locale',
    'permalink: /legal/$locale/$slug/',
    '---',
    '',
  ];

  final normalizedBody = _ensureTerminalNewline(body);
  final content = '${frontMatter.join('\n')}$normalizedBody';
  output.writeAsStringSync(content);
}

int _generateCanonicalRedirects() {
  final templateFile = File('tool/templates/redirect_template.html');
  if (!templateFile.existsSync()) {
    stderr.writeln(
      'Redirect template not found at ${templateFile.path}. Skipping canonical redirects.',
    );
    return 0;
  }
  final template = templateFile.readAsStringSync();
  var count = 0;
  for (final entry in _canonicalRedirects.entries) {
    final slug = entry.key;
    final defaultLang = entry.value;
    final html = template
        .replaceAll('@@SLUG@@', slug)
        .replaceAll('@@DEFAULT_LANG@@', defaultLang);
    final output = File('docs/legal/$slug/index.html');
    output.parent.createSync(recursive: true);
    output.writeAsStringSync(_ensureTerminalNewline(html));
    count++;
  }
  return count;
}

String? _extractTitle(String body) {
  for (final line in body.split('\n')) {
    final trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return trimmed.substring(2).trim();
    }
  }
  return null;
}

String _ensureTerminalNewline(String text) {
  return text.endsWith('\n') ? text : '$text\n';
}
