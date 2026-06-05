const express = require('express');
const path = require('path');
const fs = require('fs');
const YTDlpWrap = require('yt-dlp-wrap').default;
const app = express();

app.use(express.json());

// Configura a pasta correta de cache e downloads permitida pelo Render
const baseFolder = process.env.XDG_CACHE_HOME || __dirname;
const downloadFolder = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder);
}

// Força o download do executável correto do yt-dlp para dentro do servidor Linux
const ytDlpPath = path.join(baseFolder, 'yt-dlp');
const ytDlpWrap = new YTDlpWrap(fs.existsSync(ytDlpPath) ? ytDlpPath : null);

(async () => {
    try {
        console.log('Iniciando verificação do motor de mídia na nuvem...');
        if (!fs.existsSync(ytDlpPath)) {
            await YTDlpWrap.downloadFromGithub(ytDlpPath);
            console.log('Motor de mídia baixado e instalado com sucesso na nuvem!');
        } else {
            console.log('Motor de mídia já estava pronto no cache.');
        }
    } catch (err) {
        console.error('Aviso ao preparar motor na nuvem:', err.message);
    }
})();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/download', async (req, res) => {
    const videoUrl = req.body.url;

    if (!videoUrl) {
        return res.status(400).json({ error: 'URL não fornecida.' });
    }

    const fileName = 'video_hd_' + Date.now() + '.mp4';
    const outputPath = path.join(downloadFolder, fileName);

    try {
        console.log('Processando extração de mídia na nuvem...');
        
        const activeInstance = fs.existsSync(ytDlpPath) ? new YTDlpWrap(ytDlpPath) : ytDlpWrap;
        
        await activeInstance.execPromise([
            videoUrl,
            '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            '-o', outputPath,
            '--no-check-certificates',
            '--no-warnings'
        ]);

        if (fs.existsSync(outputPath)) {
            console.log('Mídia decodificada e pronta.');
            return res.json({ url: '/get-video?file=' + fileName });
        } else {
            throw new Error('Arquivo não gerado.');
        }

    } catch (error) {
        console.error('Erro na extração:', error.message);
        return res.status(500).json({ error: 'Não foi possível processar este link.' });
    }
});

app.get('/get-video', (req, res) => {
    const fileName = req.query.file;
    if (!fileName) return res.status(400).send('Arquivo inválido.');

    const filePath = path.join(downloadFolder, fileName);

    if (fs.existsSync(filePath)) {
        res.download(filePath, 'video_premium.mp4', (err) => {
            if (!err) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error('Erro de limpeza:', e.message);
                }
            }
        });
    } else {
        res.status(404).send('Arquivo expirado ou não encontrado.');
    }
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log('==================================================');
    console.log(' Servidor estável e rodando na porta: ' + port);
    console.log('==================================================');
});
    if (!videoUrl) {
        return res.status(400).json({ error: 'URL não fornecida.' });
    }

    const fileName = 'video_hd_' + Date.now() + '.mp4';
    const outputPath = path.join(downloadFolder, fileName);

    try {
        console.log('Baixando mídia em altíssima resolução...');
        
        // Comando do motor focado em Full HD / Máxima Qualidade disponível
        await ytDlpWrap.execPromise([
            videoUrl,
            '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            '-o', outputPath,
            '--no-check-certificates',
            '--no-warnings'
        ]);

        if (fs.existsSync(outputPath)) {
            console.log('Vídeo HD pronto para envio.');
            return res.json({ url: '/get-video?file=' + fileName });
        } else {
            throw new Error('Arquivo não foi gerado no servidor.');
        }

    } catch (error) {
        console.error('Erro no motor local:', error.message);
        return res.status(500).json({ error: 'Não foi possível baixar este link.' });
    }
});

// Rota que entrega o arquivo e limpa o espaço para não encher o servidor
app.get('/get-video', (req, res) => {
    const fileName = req.query.file;
    if (!fileName) return res.status(400).send('Arquivo não especificado.');

    const filePath = path.join(downloadFolder, fileName);

    if (fs.existsSync(filePath)) {
        res.download(filePath, 'video_full_hd.mp4', (err) => {
            if (!err) {
                try {
                    fs.unlinkSync(filePath);
                    console.log('Arquivo temporário limpo com sucesso.');
                } catch (e) {
                    console.error('Erro ao deletar arquivo:', e.message);
                }
            }
        });
    } else {
        res.status(404).send('Arquivo não encontrado.');
    }
});

// Configuração de Porta Automática para funcionar no PC e na Nuvem
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log('==================================================');
    console.log(' Servidor rodando perfeitamente na porta: ' + port);
    console.log('==================================================');
});

