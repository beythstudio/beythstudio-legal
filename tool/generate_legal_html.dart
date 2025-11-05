import 'dart:convert';
import 'dart:io';

const List<_LegalPage> _pages = <_LegalPage>[
  _LegalPage(
    slug: 'privacy',
    title: 'Privacy Policy | Legal Prism',
    heading: 'Privacy Policy',
    versionKey: 'privacy',
  ),
  _LegalPage(
    slug: 'terms',
    title: 'Terms | Legal Prism',
    heading: 'Terms',
    versionKey: 'terms',
    diffSlug: 'terms',
    extraModuleImports: <String>[
      "import '../_shared/external.js';",
    ],
  ),
  _LegalPage(
    slug: 'tokusho',
    title: 'Tokusho | Legal Prism',
    heading: '特定商取引法',
    versionKey: 'tokusho',
    diffSlug: 'tokusho',
    extraModuleImports: <String>[
      "import '../_shared/external.js';",
    ],
  ),
  _LegalPage(
    slug: 'outbound-data',
    title: 'External Data Policy | Legal Prism',
    heading: 'External Data Policy',
    versionKey: 'external-data-policy',
    diffSlug: 'outbound-data',
    noscriptExtra: '''
  <!-- 外部送信マップの静的フォールバック -->
  <div>
    <!-- このファイルはJS無効時にのみ意味があります。ビルドで差し込む運用も可 -->
  </div>''',
    extraModuleImports: <String>[
      "import '../_shared/external.js';",
    ],
  ),
];

void main(List<String> args) {
  final headerTemplate = _readTemplate();
  final versions = _loadVersions();

  for (final page in _pages) {
    final latestVersion = versions[page.versionKey]?.latest ?? 'latest';
    final header = headerTemplate
        .replaceAll('@@SLUG@@', page.slug)
        .replaceAll('@@NOSCRIPT_EXTRA@@', page.noscriptExtra ?? '');
    final versionLine = _buildVersionLine(latestVersion);
    final extraScript = _buildExtraScript(page);
    final html = _buildDocument(page, header, versionLine, extraScript);

    final output = File('docs/legal/${page.slug}/index.html');
    output.parent.createSync(recursive: true);
    output.writeAsStringSync('$html\n');
  }
}

String _buildDocument(
  _LegalPage page,
  String header,
  String versionLine,
  String extraScript,
) {
  return '''
<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <title>${page.title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,follow" />
  <link rel="alternate" hreflang="ja" href="/legal/ja/${page.slug}/" />
  <link rel="alternate" hreflang="en" href="/legal/en/${page.slug}/" />
  <link rel="alternate" hreflang="x-default" href="/legal/${page.slug}/" />
  <link rel="canonical" href="/legal/${page.slug}/" />
  <link rel="stylesheet" href="/assets/legal.css" />
  <link rel="stylesheet" href="/legal/shared/reader.css" />
</head>
<body data-legal-slug="${page.slug}">
$header
  <header class="lp-page-intro">
    <h1>${page.heading}</h1>
${versionLine.isEmpty ? '' : '    $versionLine\n'}
  </header>
  <main id="viewport" aria-live="polite"></main>
  <script type="module" src="../_shared/_router.js"></script>
$extraScript
</body>
</html>''';
}

String _buildVersionLine(String latestVersion) {
  if (latestVersion.isEmpty) return '';
  return '<p class="lp-version">Version: $latestVersion</p>';
}

String _buildExtraScript(_LegalPage page) {
  if (page.extraModuleImports.isEmpty && page.diffSlug == null) {
    return '';
  }
  final buffer = StringBuffer()
    ..writeln('  <script type="module">');
  for (final importLine in page.extraModuleImports) {
    buffer.writeln('    $importLine');
  }
  if (page.diffSlug != null) {
    buffer.writeln("    import { applyDiffHighlight } from '../_shared/diff.js';");
    buffer.writeln(
      "    const version = new URLSearchParams(location.search).get('v') || 'latest';",
    );
    buffer.writeln("    applyDiffHighlight('${page.diffSlug}', version);");
  }
  buffer.writeln('  </script>');
  return buffer.toString();
}

String _readTemplate() {
  final file = File('tool/templates/_legal_header.html');
  if (!file.existsSync()) {
    stderr.writeln('Header template missing at ${file.path}');
    exit(1);
  }
  return file.readAsStringSync();
}

Map<String, _VersionMeta> _loadVersions() {
  final file = File('docs/legal/versions.json');
  if (!file.existsSync()) {
    stderr.writeln(
      'Version metadata not found at ${file.path}. Using default "latest".',
    );
    return <String, _VersionMeta>{};
  }
  final raw = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
  return raw.map(
    (key, value) {
      final map = value as Map<String, dynamic>;
      final latest = map['latest']?.toString() ?? 'latest';
      return MapEntry(key, _VersionMeta(latest: latest));
    },
  );
}

class _LegalPage {
  const _LegalPage({
    required this.slug,
    required this.title,
    required this.heading,
    required this.versionKey,
    this.diffSlug,
    this.extraModuleImports = const <String>[],
    this.noscriptExtra,
  });

  final String slug;
  final String title;
  final String heading;
  final String versionKey;
  final String? diffSlug;
  final List<String> extraModuleImports;
  final String? noscriptExtra;
}

class _VersionMeta {
  const _VersionMeta({required this.latest});

  final String latest;
}
