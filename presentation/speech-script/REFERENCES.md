# Speaking-script speech sources

| Information | Source | Organization or author | Purpose | Access | Version | Checked | Task |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Microsoft neural voices | [Speech language support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts) | Microsoft Learn | Verify the names and languages of Aria and Xiaoxiao neural voices | Public documentation | Current voice catalogue | 2026-11-09 | TASK-20261109-006 |
| Edge speech client | [edge-tts source repository](https://github.com/rany2/edge-tts) | rany2, third-party author | Client usage, Microsoft Edge online TTS, voice selection and rate controls | Public repository, online speech generation | edge-tts 7.3.1 | 2026-11-09 | TASK-20261109-006 |

The generation path uses the `edge-tts` client and Microsoft's Edge online neural speech service. Microsoft Learn is the voice reference. The client is maintained by its own author. Both configured voice names were also checked against the live `edge_tts.list_voices()` result, and sentence synthesis succeeded on the checked date.
