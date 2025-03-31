const owner = "renatoaraihirooka"; // Substitua pelo usuário ou organização
const repo = "portal2"; // Substitua pelo nome do repositório
const githubToken = `${{TOKEN}}`; // Substitua pelo seu token pessoal

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('runTests').addEventListener('click', async () => {
        document.getElementById('status').innerHTML = "<br>"; // Adiciona uma linha em branco
        document.getElementById('jobLink').innerHTML = ""; // Limpa o link anterior

        // Disparar o evento repository_dispatch
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${githubToken}`
            },
            body: JSON.stringify({ event_type: 'run-maven-tests' })
        });

        if (response.ok) {
            document.getElementById('status').innerHTML += "Workflow Iniciado! Aguarde...";
            setTimeout(async () => {
                const workflowRun = await fetchWorkflowRun();
                if (workflowRun) {
                    const jobUrl = workflowRun.html_url;
                    document.getElementById('jobLink').innerHTML = `<a href="${jobUrl}" target="_blank">Acessar Job no GitHub</a>`;
                    await monitorWorkflowCompletion(workflowRun.id); // Monitorar a conclusão do workflow
                } else {
                    document.getElementById('status').innerText = "Não foi possível obter o link do job.";
                }
            }, 5000); // Aguarda 10 segundos antes de buscar o status
        } else {
            document.getElementById('status').innerText = "Erro ao acionar workflow.";
        }
    });
});

async function fetchWorkflowRun() {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs`, {
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${githubToken}`
        }
    });

    if (response.ok) {
        const data = await response.json();
        return data.workflow_runs && data.workflow_runs.length > 0 ? data.workflow_runs[0] : null;
    } else {
        console.error("Erro ao buscar os workflows:", await response.text());
        return null;
    }
}

async function monitorWorkflowCompletion(runId) {
    const interval = 5000; // Intervalo de 5 segundos
    const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`;

    const checkStatus = async () => {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${githubToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.status === "completed") {
                const now = new Date();
                const formattedDate = now.toLocaleDateString('pt-BR');
                const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const conclusionUpperCase = data.conclusion.toUpperCase(); // Converte para letras maiúsculas

                // Atualiza a mensagem "Workflow Iniciado! Aguarde..." para "Workflow Iniciado!"
                const statusElement = document.getElementById('status');
                statusElement.innerHTML = statusElement.innerHTML.replace("Workflow Iniciado! Aguarde...", "Workflow Iniciado!");

                // Adiciona a mensagem de finalização
                statusElement.innerHTML += `<br>Workflow Finalizado! Resultado: ${conclusionUpperCase} em ${formattedDate} - ${formattedTime}`;
                return true;
            }
        } else {
            console.error("Erro ao verificar o status do workflow:", await response.text());
        }
        return false;
    };

    const intervalId = setInterval(async () => {
        const isCompleted = await checkStatus();
        if (isCompleted) {
            clearInterval(intervalId); // Para o monitoramento quando finalizado
        }
    }, interval);
}