package com.shopjoy.ecBeBo.bo.ec.cm.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.cm.data.dto.CmChattDto;
import com.shopjoy.ecBeBo.base.ec.cm.data.dto.CmChattMemberDto;
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
 * BO CmChatt 서비스 — base CmChattService 위임 + BO 전용 로직 (changeStatus, sendMsg 등)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoCmChattService {

    private final CmChattService cmChattService;
    private final CmChattMsgService cmChattMsgService;
    private final CmChattMemberService cmChattMemberService;
    private final CmChattRepository cmChattRepository;

    @PersistenceContext
    private EntityManager em;

    /* ── 채팅방 CRUD ──────────────────────────────── */

    public CmChattDto.Item getById(String id) { return cmChattService.getById(id); }

    public List<CmChattDto.Item> getList(CmChattDto.Request req) { return cmChattService.getList(req); }

    public BasePage<CmChattDto.Item> getPageData(CmChattDto.Request req) { return cmChattService.getPageData(req); }

    @Transactional
    public CmChatt create(CmChatt body) {
        if (body.getChattStatusCd() == null) body.setChattStatusCd("PENDING");
        return cmChattService.create(body);
    }

    @Transactional
    public CmChatt update(String id, CmChatt body) { return cmChattService.update(id, body); }

    @Transactional
    public void delete(String id) { cmChattService.delete(id); }

    /* ── 상태 변경 ──────────────────────────────── */

    @Transactional
    public CmChattDto.Item changeStatus(String id, String statusCd) {
        // [쿼리 메서드] 채팅 방 단건 조회
        CmChatt entity = cmChattRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        entity.setChattStatusCdBefore(entity.getChattStatusCd());
        entity.setChattStatusCd(statusCd);
        if ("CLOSED".equals(statusCd)) {
            entity.setCloseDate(LocalDateTime.now());
        }
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 채팅 방 저장
        CmChatt saved = cmChattRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return cmChattService.getById(id);
    }

    /* ── 메시지 ──────────────────────────────── */

    public List<CmChattMsgDto.Item> getMessages(String chattId, String afterMsgId) {
        CmChattMsgDto.Request req = new CmChattMsgDto.Request();
        req.setChattId(chattId);
        if (afterMsgId != null && !afterMsgId.isBlank()) {
            req.setAfterMsgId(afterMsgId);
        }
        return cmChattMsgService.getList(req);
    }

    @Transactional
    public CmChattMsg sendMsg(String chattId, CmChattMsgDto.SendRequest body) {
        // [쿼리 메서드] 채팅 방 단건 조회
        CmChatt chatt = cmChattRepository.findById(chattId)
            .orElseThrow(() -> new CmBizException("존재하지 않는 채팅방: " + chattId + "::" + CmUtil.svcCallerInfo(this)));
        if ("CLOSED".equals(chatt.getChattStatusCd())) {
            throw new CmBizException("종료된 채팅방에는 메시지를 보낼 수 없습니다.");
        }

        String authId = SecurityUtil.getAuthUser().authId();
        CmChattMsg msg = CmChattMsg.builder()
            .chattId(chattId)
            .senderTypeCd(body.getSenderTypeCd() != null ? body.getSenderTypeCd() : "ADMIN")
            .senderId(authId)
            .senderNm(authId)
            .msgText(body.getMsgText())
            .msgTypeCd(body.getMsgTypeCd() != null ? body.getMsgTypeCd() : "TEXT")
            .refTypeCd(body.getRefTypeCd())
            .refId(body.getRefId())
            .readYn("N")
            .sendDate(LocalDateTime.now())
            .build();

        CmChattMsg saved = cmChattMsgService.create(msg);

        // 채팅방 lastMsgDate 갱신
        chatt.setLastMsgDate(LocalDateTime.now());
        chatt.setUpdBy(authId);
        chatt.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 채팅 방 저장
        cmChattRepository.save(chatt);

        return saved;
    }

    /* ── 참여자 ──────────────────────────────── */

    public List<CmChattMemberDto.Item> getMembers(String chattId) {
        CmChattMemberDto.Request req = new CmChattMemberDto.Request();
        req.setChattId(chattId);
        return cmChattMemberService.getList(req);
    }
}
