package com.shopjoy.ecadminapi.bo.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattRoomDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattRoom;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmChattRoomRepository;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmChattRoomService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * BO CmChatt 서비스 — base CmChattRoomService 위임 (thin wrapper) + changeStatus.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoCmChattService {

    private final CmChattRoomService cmChattRoomService;
    private final CmChattRoomRepository cmChattRoomRepository;

    @PersistenceContext
    private EntityManager em;

    public CmChattRoomDto.Item getById(String id) { return cmChattRoomService.getById(id); }
    public List<CmChattRoomDto.Item> getList(CmChattRoomDto.Request req) { return cmChattRoomService.getList(req); }
    public CmChattRoomDto.PageResponse getPageData(CmChattRoomDto.Request req) { return cmChattRoomService.getPageData(req); }

    @Transactional public CmChattRoom create(CmChattRoom body) {
        if (body.getChattStatusCd() == null) body.setChattStatusCd("ACTIVE");
        return cmChattRoomService.create(body);
    }
    @Transactional public CmChattRoom update(String id, CmChattRoom body) { return cmChattRoomService.update(id, body); }
    @Transactional public void delete(String id) { cmChattRoomService.delete(id); }
    @Transactional public List<CmChattRoom> saveList(List<CmChattRoom> rows) { return cmChattRoomService.saveList(rows); }

    /** changeStatus — chattStatusCd 변경 */
    @Transactional
    public CmChattRoomDto.Item changeStatus(String id, String statusCd) {
        CmChattRoom entity = cmChattRoomRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id));
        entity.setChattStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmChattRoom saved = cmChattRoomRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return cmChattRoomService.getById(id);
    }
}
