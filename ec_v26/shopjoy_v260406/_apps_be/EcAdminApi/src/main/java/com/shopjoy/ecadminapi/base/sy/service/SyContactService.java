package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyContact;
import com.shopjoy.ecadminapi.base.sy.repository.SyContactRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyContactService {

    private final SyContactRepository syContactRepository;

    @PersistenceContext
    private EntityManager em;

    /* 문의 키조회 */
    public SyContactDto.Item getById(String id) {
        SyContactDto.Item dto = syContactRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyContactDto.Item getByIdOrNull(String id) {
        return syContactRepository.selectById(id).orElse(null);
    }

    /* 문의 상세조회 */
    public SyContact findById(String id) {
        return syContactRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyContact findByIdOrNull(String id) {
        return syContactRepository.findById(id).orElse(null);
    }

    /* 문의 키검증 */
    public boolean existsById(String id) {
        return syContactRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syContactRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 문의 목록조회 */
    public List<SyContactDto.Item> getList(SyContactDto.Request req) {
        return syContactRepository.selectList(req);
    }

    /* 문의 페이지조회 */
    public SyContactDto.PageResponse getPageData(SyContactDto.Request req) {
        PageHelper.addPaging(req);
        return syContactRepository.selectPageData(req);
    }

    /* 문의 등록 */
    @Transactional
    public SyContact create(SyContact body) {
        body.setContactId(CmUtil.generateId("sy_contact"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyContact saved = syContactRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 문의 수정 */
    @Transactional
    public SyContact update(String id, SyContact body) {
        CmUtil.requireId(id, "id", this);
        SyContact entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "contactId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyContact saved = syContactRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 문의 수정 */
    @Transactional
    public SyContact updateSelective(SyContact entity) {
        if (entity.getContactId() == null) throw new CmBizException("contactId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getContactId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getContactId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syContactRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 문의 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyContact entity = findById(id);
        syContactRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyContact saveOneBase(SyContact entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getContactId() == null || entity.getContactId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getContactId() == null)
                throw new CmBizException("삭제 대상 contactId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!syContactRepository.existsById(entity.getContactId()))
                throw new CmBizException("존재하지 않는 SyContact입니다: " + entity.getContactId() + "::" + CmUtil.svcCallerInfo(this));
            syContactRepository.deleteById(entity.getContactId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setContactId(CmUtil.generateId("sy_contact"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            SyContact saved = syContactRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getContactId() == null)
                throw new CmBizException("수정 대상 contactId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = syContactRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 SyContact입니다: " + entity.getContactId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getContactId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<SyContact> rows) {
        /* 0단계: rowStatus 정규화 */
        for (SyContact row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getContactId() == null || row.getContactId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, SyContact::getContactId, "U", "contactId", this);
        CmUtil.requireRowIds(rows, SyContact::getContactId, "D", "contactId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(SyContact::getContactId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syContactRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<SyContact> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (SyContact row : updateRows) {
            row.setUpdBy(authId);
            int affected = syContactRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getContactId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<SyContact> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyContact row : insertRows) {
            row.setContactId(CmUtil.generateId("sy_contact"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syContactRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
