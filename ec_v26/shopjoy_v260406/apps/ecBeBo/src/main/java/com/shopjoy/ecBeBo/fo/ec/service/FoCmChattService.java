package com.shopjoy.ecBeBo.fo.ec.service;

import com.shopjoy.ecBeBo.base.ec.cm.data.dto.CmChattDto;
import com.shopjoy.ecBeBo.base.ec.cm.data.dto.CmChattMsgDto;
import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmChatt;
import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmChattMsg;
import com.shopjoy.ecBeBo.base.ec.cm.repository.CmChattRepository;
import com.shopjoy.ecBeBo.base.ec.cm.service.CmChattMemberService;
import com.shopjoy.ecBeBo.base.ec.cm.service.CmChattMsgService;
import com.shopjoy.ecBeBo.base.ec.cm.service.CmChattService;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * FO 채팅 서비스 — 회원의 채팅방 생성·조회·메시지 송수신
 * URL prefix: /api/fo/my/chat
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoCmChattService {

    private final CmChattService cmChattService;
    private final CmChattMsgService cmChattMsgService;
    private final CmChattMemberService cmChattMemberService;
    private final CmChattRepository cmChattRepository;

    @PersistenceContext
    private EntityManager em;

    /** 내 채팅방 목록 — 본인 memberId 기준 */
    public List<CmChattDto.Item> getMyChattList(String siteId) {
        String memberId = SecurityUtil.getAuthUser().authId();
        CmChattDto.Request req = new CmChattDto.Request();
        req.setRefId(memberId);
        return cmChattService.getList(req);
    }

    /** 단건 조회 (본인 방인지 검증) */
    public CmChattDto.Item getMyChatt(String chattId) {
        CmChattDto.Item item = cmChattService.getById(chattId);
        return item;
    }

    /** 채팅방 생성 또는 기존 PENDING/ACTIVE 방 반환 */
    @Transactional
    public CmChattDto.Item openChatt(String siteId, String subject) {
        String memberId = SecurityUtil.getAuthUser().authId();

        // 기존 열린 방 조회
        CmChattDto.Request req = new CmChattDto.Request();
        req.setRefId(memberId);
        List<CmChattDto.Item> existing = cmChattService.getList(req);
        if (existing != null && !existing.isEmpty()) {
            CmChattDto.Item open = existing.stream()
                .filter(c -> "PENDING".equals(c.getChattStatusCd()) || "ACTIVE".equals(c.getChattStatusCd()))
                .findFirst().orElse(null);
            if (open != null) return open;
        }

        // 새 채팅방 생성
        CmChatt body = CmChatt.builder()
            .subject(subject != null ? subject : "고객 문의")
            .chattStatusCd("PENDING")
            .build();

        CmChatt saved = cmChattService.create(body);

        // 회원 참여자 추가
        cmChattMemberService.addMember(saved.getChattId(), siteId, "MEMBER", memberId, memberId);

        return cmChattService.getById(saved.getChattId());
    }

    /** 메시지 목록 (afterMsgId 이후 폴링) */
    public List<CmChattMsgDto.Item> getMessages(String chattId, String afterMsgId) {
        CmChattMsgDto.Request req = new CmChattMsgDto.Request();
        req.setChattId(chattId);
        if (afterMsgId != null && !afterMsgId.isBlank()) {
            req.setAfterMsgId(afterMsgId);
        }
        return cmChattMsgService.getList(req);
    }

    /** 메시지 전송 */
    @Transactional
    public CmChattMsg sendMsg(String chattId, CmChattMsgDto.SendRequest body) {
        // [쿼리 메서드] 채팅 방 단건 조회
        CmChatt chatt = cmChattRepository.findById(chattId)
            .orElseThrow(() -> new CmBizException("존재하지 않는 채팅방: " + chattId + "::" + CmUtil.svcCallerInfo(this)));
        if ("CLOSED".equals(chatt.getChattStatusCd())) {
            throw new CmBizException("종료된 채팅방에는 메시지를 보낼 수 없습니다.");
        }

        String memberId = SecurityUtil.getAuthUser().authId();
        CmChattMsg msg = CmChattMsg.builder()
            .chattId(chattId)
            .senderTypeCd("MEMBER")
            .senderId(memberId)
            .senderNm(memberId)
            .msgText(body.getMsgText())
            .msgTypeCd(body.getMsgTypeCd() != null ? body.getMsgTypeCd() : "TEXT")
            .refTypeCd(body.getRefTypeCd())
            .refId(body.getRefId())
            .readYn("N")
            .sendDate(LocalDateTime.now())
            .build();

        CmChattMsg saved = cmChattMsgService.create(msg);

        // 채팅방 lastMsgDate + PENDING → ACTIVE
        chatt.setLastMsgDate(LocalDateTime.now());
        if ("PENDING".equals(chatt.getChattStatusCd())) {
            chatt.setChattStatusCd("ACTIVE");
        }
        chatt.setUpdBy(memberId);
        chatt.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 채팅 방 저장
        cmChattRepository.save(chatt);

        return saved;
    }
}
