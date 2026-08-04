@echo off
setlocal
if "%~1"=="" (set "PATCH_API_ACTION=patch") else (set "PATCH_API_ACTION=%~1")
if "%~2"=="" (set "PATCH_API_SERVER_DIR=..\GPS_Server") else (set "PATCH_API_SERVER_DIR=%~2")
set "SCRIPT=%~f0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$text=[IO.File]::ReadAllText('%SCRIPT%'); $marker='# POWERSHELL_START'; $idx=$text.LastIndexOf($marker); if($idx -lt 0){throw 'marker not found'}; $ps=$text.Substring($idx+$marker.Length); $tmp=Join-Path $env:TEMP ('patch_gps_api_resources_' + [guid]::NewGuid() + '.ps1'); Set-Content -LiteralPath $tmp -Value $ps -Encoding UTF8; try { & $tmp; exit $LASTEXITCODE } finally { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue }"
exit /b %ERRORLEVEL%

# POWERSHELL_START
$Action = if ($env:PATCH_API_ACTION) { $env:PATCH_API_ACTION } else { "patch" }
$ServerDir = if ($env:PATCH_API_SERVER_DIR) { $env:PATCH_API_SERVER_DIR } else { "..\GPS_Server" }
if ($Action -notin @("patch", "restore", "status")) {
  throw "Unknown action '$Action'. Use: patch, restore, or status."
}

$ErrorActionPreference = "Stop"

function Resolve-FullPath([string] $Path) {
  if ([IO.Path]::IsPathRooted($Path)) {
    return [IO.Path]::GetFullPath($Path)
  }
  return [IO.Path]::GetFullPath((Join-Path (Get-Location) $Path))
}

function Require-Command([string] $Name) {
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $cmd) {
    throw "Required command not found: $Name. Install/use JDK 17, or run from a machine with javac/jar in PATH."
  }
  return $cmd.Source
}

$server = Resolve-FullPath $ServerDir
$jar = Join-Path $server "tracker-server.jar"
$backup = Join-Path $server "tracker-server.jar.bak-api-scan"
$lib = Join-Path $server "lib\*"

if (!(Test-Path -LiteralPath $jar)) { throw "JAR not found: $jar" }

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-JarInfo([string] $Path) {
  $result = [ordered]@{
    Readable = $false
    EntryCount = 0
    HasManifest = $false
    HasServerResource = $false
    HasPermissionsService = $false
    HasWebServer = $false
  }
  try {
    $zip = [IO.Compression.ZipFile]::OpenRead($Path)
    try {
      $result.Readable = $true
      $result.EntryCount = $zip.Entries.Count
      $result.HasManifest = $null -ne $zip.GetEntry("META-INF/MANIFEST.MF")
      $result.HasServerResource = $null -ne $zip.GetEntry("org/traccar/api/resource/ServerResource.class")
      $result.HasPermissionsService = $null -ne $zip.GetEntry("org/traccar/api/security/PermissionsService.class")
      $result.HasWebServer = $null -ne $zip.GetEntry("org/traccar/web/WebServer.class")
    } finally {
      $zip.Dispose()
    }
  } catch {
  }
  return [pscustomobject]$result
}

function Test-JarComplete([object] $Info) {
  return $Info.Readable -and $Info.EntryCount -gt 1000 -and $Info.HasManifest -and $Info.HasServerResource -and $Info.HasPermissionsService -and $Info.HasWebServer
}

if ($Action -eq "restore") {
  if (!(Test-Path -LiteralPath $backup)) { throw "Backup not found: $backup" }
  Copy-Item -LiteralPath $backup -Destination $jar -Force
  Write-Host "RESTORED original JAR from API backup:" -ForegroundColor Green
  Write-Host "  $backup"
  Write-Host "Restart GPS_Server now."
  exit 0
}

$javap = Require-Command "javap"
$jarInfo = Get-JarInfo $jar
$jarComplete = Test-JarComplete $jarInfo
$isPatched = $false
if ($jarComplete) {
  try {
  $javapText = & $javap -classpath $jar -c -p org.traccar.web.WebServer 2>$null | Out-String -Width 240
  $isPatched = $javapText -match "org/traccar/api/resource/AttributeResource" -and $javapText -notmatch "Failed to load API resources"
  } catch {
    $isPatched = $false
  }
}

if ($Action -eq "status") {
  if (-not $jarComplete) {
    Write-Host "STATUS: BROKEN/INCOMPLETE JAR. entries=$($jarInfo.EntryCount), manifest=$($jarInfo.HasManifest), serverResource=$($jarInfo.HasServerResource)" -ForegroundColor Red
    if (Test-Path -LiteralPath $backup) {
      Write-Host "Backup exists. Run: tools\patch_gps_api_resources.bat restore"
    }
  } elseif ($isPatched) {
    Write-Host "STATUS: patched. API resources are registered directly." -ForegroundColor Green
  } else {
    Write-Host "STATUS: original/scanning. API may fail with HTTP 404 if Jersey scan returns zero resources." -ForegroundColor Yellow
  }
  exit 0
}

if (-not $jarComplete) {
  if (!(Test-Path -LiteralPath $backup)) {
    throw "Current JAR is incomplete/corrupt and backup is missing: $backup"
  }
  Write-Host "Current JAR is incomplete/corrupt. Restoring from API backup first..." -ForegroundColor Yellow
  Copy-Item -LiteralPath $backup -Destination $jar -Force
  $jarInfo = Get-JarInfo $jar
  if (-not (Test-JarComplete $jarInfo)) {
    throw "Restore failed or backup is also incomplete."
  }
  $isPatched = $false
}

if ($isPatched) {
  Write-Host "Already patched. Nothing to do." -ForegroundColor Green
  exit 0
}

$javac = Require-Command "javac"

try {
  $null = [IO.File]::Open($jar, [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None).Close()
} catch {
  throw "Cannot patch because tracker-server.jar is in use. Stop GPS_Server first, then run this patch again."
}

if (!(Test-Path -LiteralPath $backup)) {
  Copy-Item -LiteralPath $jar -Destination $backup -Force
  Write-Host "Backup created:"
  Write-Host "  $backup"
} else {
  Write-Host "Backup already exists:"
  Write-Host "  $backup"
}

$work = Join-Path $env:TEMP ("gps_api_patch_" + [Guid]::NewGuid().ToString("N"))
$srcDir = Join-Path $work "src\org\traccar\web"
$classDir = Join-Path $work "classes"
New-Item -ItemType Directory -Path $srcDir -Force | Out-Null
New-Item -ItemType Directory -Path $classDir -Force | Out-Null
$javaFile = Join-Path $srcDir "WebServer.java"

$source = @'
package org.traccar.web;

import com.google.inject.Injector;
import com.google.inject.servlet.GuiceFilter;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.eclipse.jetty.http.HttpMethod;
import org.eclipse.jetty.http.HttpStatus;
import org.eclipse.jetty.proxy.AsyncProxyServlet;
import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.RequestLogWriter;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.ErrorHandler;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.server.handler.gzip.GzipHandler;
import org.eclipse.jetty.server.session.DatabaseAdaptor;
import org.eclipse.jetty.server.session.DefaultSessionCache;
import org.eclipse.jetty.server.session.JDBCSessionDataStoreFactory;
import org.eclipse.jetty.server.session.SessionCache;
import org.eclipse.jetty.server.session.SessionHandler;
import org.eclipse.jetty.servlet.DefaultServlet;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.websocket.server.config.JettyWebSocketServletContainerInitializer;
import org.glassfish.jersey.jackson.JacksonFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.servlet.ServletContainer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.traccar.LifecycleObject;
import org.traccar.api.AsyncSocketServlet;
import org.traccar.api.CorsResponseFilter;
import org.traccar.api.DateParameterConverterProvider;
import org.traccar.api.MediaFilter;
import org.traccar.api.ResourceErrorHandler;
import org.traccar.api.resource.*;
import org.traccar.api.security.SecurityRequestFilter;
import org.traccar.config.Config;
import org.traccar.config.Keys;
import org.traccar.helper.ObjectMapperContextResolver;

import javax.sql.DataSource;
import java.io.File;
import java.io.IOException;
import java.io.Writer;
import java.net.InetSocketAddress;
import java.util.EnumSet;

public class WebServer implements LifecycleObject {

    private static final Logger LOGGER = LoggerFactory.getLogger(WebServer.class);

    private final Injector injector;
    private final Config config;
    private final Server server;

    public WebServer(Injector injector, Config config) {
        this.injector = injector;
        this.config = config;
        String address = config.getString(Keys.WEB_ADDRESS);
        int port = config.getInteger(Keys.WEB_PORT);
        server = address == null ? new Server(port) : new Server(new InetSocketAddress(address, port));

        ServletContextHandler servletHandler = new ServletContextHandler(ServletContextHandler.SESSIONS);
        JettyWebSocketServletContainerInitializer.configure(servletHandler, null);
        servletHandler.addFilter(GuiceFilter.class, "/*", EnumSet.allOf(DispatcherType.class));
        initApi(servletHandler);
        initSessionConfig(servletHandler);
        if (config.getBoolean(Keys.WEB_CONSOLE)) {
            servletHandler.addServlet(new ServletHolder(new ConsoleServlet(config)), "/console/*");
        }
        initWebApp(servletHandler);
        servletHandler.setErrorHandler(new ErrorHandler() {
            @Override
            protected void handleErrorPage(HttpServletRequest request, Writer writer, int code, String message) throws IOException {
                writer.write("<h2>HTTP ERROR " + code + " " + HttpStatus.getMessage(code) + "</h2>");
            }
        });

        HandlerList handlers = new HandlerList();
        initClientProxy(handlers);
        handlers.addHandler(servletHandler);
        handlers.addHandler(new GzipHandler());
        server.setHandler(handlers);

        if (config.hasKey(Keys.WEB_REQUEST_LOG_PATH)) {
            RequestLogWriter logWriter = new RequestLogWriter(config.getString(Keys.WEB_REQUEST_LOG_PATH));
            logWriter.setAppend(true);
            logWriter.setRetainDays(config.getInteger(Keys.WEB_REQUEST_LOG_RETAIN_DAYS));
            server.setRequestLog(new WebRequestLog(logWriter));
        }
    }

    private void initClientProxy(HandlerList handlers) {
        int osmandPort = config.getInteger(Keys.PROTOCOL_PORT.withPrefix("osmand"));
        if (osmandPort != 0) {
            ServletContextHandler proxyHandler = new ServletContextHandler() {
                @Override
                public void doScope(String target, Request baseRequest, HttpServletRequest request, HttpServletResponse response)
                        throws IOException, ServletException {
                    if ("/".equals(target) && HttpMethod.POST.asString().equals(request.getMethod())) {
                        super.doScope(target, baseRequest, request, response);
                    }
                }
            };
            ServletHolder proxyServlet = new ServletHolder(AsyncProxyServlet.Transparent.class);
            proxyServlet.setInitParameter("proxyTo", "http://localhost:" + osmandPort);
            proxyHandler.addServlet(proxyServlet, "/");
            handlers.addHandler(proxyHandler);
        }
    }

    private void initWebApp(ServletContextHandler servletHandler) {
        ServletHolder servletHolder = new ServletHolder(new DefaultOverrideServlet(config));
        servletHolder.setInitParameter("resourceBase", new File(config.getString(Keys.WEB_PATH)).getAbsolutePath());
        servletHolder.setInitParameter("dirAllowed", "false");
        if (config.getBoolean(Keys.WEB_DEBUG)) {
            servletHandler.setWelcomeFiles(new String[] {"debug.html", "index.html"});
        } else {
            String cache = config.getString(Keys.WEB_CACHE_CONTROL);
            if (cache != null && !cache.isEmpty()) {
                servletHolder.setInitParameter("cacheControl", cache);
            }
            servletHandler.setWelcomeFiles(new String[] {"release.html", "index.html"});
        }
        servletHandler.addServlet(servletHolder, "/*");
    }

    private void initApi(ServletContextHandler servletHandler) {
        String mediaPath = config.getString(Keys.MEDIA_PATH);
        if (mediaPath != null) {
            ServletHolder mediaServlet = new ServletHolder(DefaultServlet.class);
            mediaServlet.setInitParameter("resourceBase", new File(mediaPath).getAbsolutePath());
            mediaServlet.setInitParameter("dirAllowed", "false");
            mediaServlet.setInitParameter("pathInfoOnly", "true");
            servletHandler.addServlet(mediaServlet, "/api/media/*");
        }
        ResourceConfig resourceConfig = new ResourceConfig();
        resourceConfig.property("jersey.config.server.wadl.disableWadl", true);
        resourceConfig.registerClasses(
                JacksonFeature.class, ObjectMapperContextResolver.class, DateParameterConverterProvider.class,
                SecurityRequestFilter.class, CorsResponseFilter.class, ResourceErrorHandler.class,
                AttributeResource.class, CalendarResource.class, CommandResource.class, DeviceResource.class,
                DriverResource.class, EventResource.class, GeofenceResource.class, GroupResource.class,
                MaintenanceResource.class, NotificationResource.class, OrderResource.class, PasswordResource.class,
                PermissionsResource.class, PositionResource.class, ReportResource.class, ServerResource.class,
                SessionResource.class, StatisticsResource.class, UserResource.class
        );
        servletHandler.addServlet(new ServletHolder(new ServletContainer(resourceConfig)), "/api/*");
    }

    private void initSessionConfig(ServletContextHandler servletHandler) {
        if (config.getBoolean(Keys.WEB_PERSIST_SESSION)) {
            DatabaseAdaptor databaseAdaptor = new DatabaseAdaptor();
            databaseAdaptor.setDatasource(injector.getInstance(DataSource.class));
            JDBCSessionDataStoreFactory factory = new JDBCSessionDataStoreFactory();
            factory.setDatabaseAdaptor(databaseAdaptor);
            SessionHandler sessionHandler = servletHandler.getSessionHandler();
            SessionCache sessionCache = new DefaultSessionCache(sessionHandler);
            sessionCache.setSessionDataStore(factory.getSessionDataStore(sessionHandler));
            sessionHandler.setSessionCache(sessionCache);
        }
        int timeout = config.getInteger(Keys.WEB_SESSION_TIMEOUT);
        if (timeout > 0) {
            servletHandler.getSessionHandler().setMaxInactiveInterval(timeout);
            servletHandler.getServletContext().getSessionCookieConfig().setMaxAge(timeout);
        }
        String sameSite = config.getString(Keys.WEB_SAME_SITE_COOKIE);
        if (sameSite != null) {
            switch (sameSite.toLowerCase()) {
                case "lax":
                    servletHandler.getServletContext().getSessionCookieConfig().setComment("__SAME_SITE_LAX__");
                    break;
                case "strict":
                    servletHandler.getServletContext().getSessionCookieConfig().setComment("__SAME_SITE_STRICT__");
                    break;
                case "none":
                    servletHandler.getServletContext().getSessionCookieConfig().setSecure(true);
                    servletHandler.getServletContext().getSessionCookieConfig().setComment("__SAME_SITE_NONE__");
                    break;
                default:
                    break;
            }
        }
        servletHandler.getServletContext().getSessionCookieConfig().setHttpOnly(true);
    }

    @Override
    public void start() throws Exception {
        server.start();
    }

    @Override
    public void stop() throws Exception {
        server.stop();
    }
}
'@

try {
  [IO.File]::WriteAllText($javaFile, $source, [Text.UTF8Encoding]::new($false))
  & $javac -encoding UTF-8 -cp "$jar;$lib" -d $classDir $javaFile
  if ($LASTEXITCODE -ne 0) { throw "javac failed" }

  $zip = [IO.Compression.ZipFile]::Open($jar, [IO.Compression.ZipArchiveMode]::Update)
  try {
    foreach ($name in @("org/traccar/web/WebServer.class", "org/traccar/web/WebServer`$1.class", "org/traccar/web/WebServer`$2.class")) {
      $old = $zip.GetEntry($name)
      if ($old) { $old.Delete() }
      $src = Join-Path $classDir ($name -replace '/', [IO.Path]::DirectorySeparatorChar)
      if (!(Test-Path -LiteralPath $src)) { throw "Compiled class missing: $src" }
      [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $src, $name, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
  } finally {
    $zip.Dispose()
  }
  Write-Host "PATCHED OK: API resources are registered directly." -ForegroundColor Green
  Write-Host "  $jar"
  Write-Host "Restart GPS_Server, then test: curl -i http://localhost:9090/api/server"
} finally {
  Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
}
