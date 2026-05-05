package com.shopjoy.ecadminapi.bo.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattRoomDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattRoom;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmChattRoomMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmChattRoomRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class BoCmChattService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final CmChattRoomMapper cmChattRoomMapper;
    private final CmChattRoomRepository cmChattRoomRepository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<CmChattRoomDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return cmChattRoomMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<CmChattRoomDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(cmChattRoomMapper.selectPageList(p), cmChattRoomMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public CmChattRoomDto getById(String id) {
        CmChattRoomDto dto = cmChattRoomMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public CmChattRoom create(CmChattRoom body) {
        if (body.getChattStatusCd() == null) body.setChattStatusCd("ACTIVE");
        body.setChattRoomId("CR" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmChattRoom saved = cmChattRoomRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    @Transactional
    public CmChattRoomDto update(String id, CmChattRoom body) {
        CmChattRoom entity = cmChattRoomRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "chattRoomId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmChattRoom saved = cmChattRoomRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        CmChattRoom entity = cmChattRoomRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        cmChattRoomRepository.delete(entity);
        em.flush();
        if (cmChattRoomRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public CmChattRoomDto changeStatus(String id, String statusCd) {
        CmChattRoom entity = cmChattRoomRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id));
        entity.setChattStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmChattRoom saved = cmChattRoomRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }
    @Transactional
    public void saveList(List<CmChattRoom> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getChattRoomId() != null)
            .map(CmChattRoom::getChattRoomId)
            .toList();
        if (!deleteIds.isEmpty()) {
            cmChattRoomRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        for (CmChattRoom row : rows) {
            if (!"U".equals(row.getRowStatus())) continue;
            String id = Objects.requireNonNull(row.getChattRoomId(), "chattRoomId must not be null");
            CmChattRoom entity = cmChattRoomRepository.findById(id)
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
            VoUtil.voCopyExclude(row, entity, "chattRoomId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            cmChattRoomRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        for (CmChattRoom row : rows) {
            if (!"I".equals(row.getRowStatus())) continue;
            row.setChattRoomId("CR" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            cmChattRoomRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
