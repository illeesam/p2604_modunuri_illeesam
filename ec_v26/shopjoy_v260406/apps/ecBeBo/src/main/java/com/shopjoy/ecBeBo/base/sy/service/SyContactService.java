package com.shopjoy.ecBeBo.base.sy.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.constant.SyAttachRefTableConst;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyContact;
import com.shopjoy.ecBeBo.base.sy.repository.SyContactRepository;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.util.PageHelper;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import com.shopjoy.ecBeBo.common.util.VoUtil;
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
    private final SyAttachService syAttachService;

    @PersistenceContext
    private EntityManager em;

    /* 문의 키조회 */
    public SyContactDto.Item getById(String id) {
        // [QueryDSL] 고객문의 단건 조회
        SyContactDto.Item dto = syContactRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyContactDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 고객문의 단건 조회
        return syContactRepository.selectById(id).orElse(null);
    }

    /* 문의 상세조회 */
    public SyContact findById(String id) {
        // [쿼리 메서드] 고객문의 단건 조회
        return syContactRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyContact findByIdOrNull(String id) {
        // [쿼리 메서드] 고객문의 단건 조회
        return syContactRepository.findById(id).orElse(null);
    }

    /* 문의 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 고객문의 존재 여부 확인
        return syContactRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 고객문의 존재 여부 확인
        if (!syContactRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 문의 목록조회 */
    public List<SyContactDto.Item> getList(SyContactDto.Request req) {
        // [QueryDSL] 고객문의 목록 조회
        return syContactRepository.selectList(req);
    }

    /* 문의 페이지조회 */
    public BasePage<SyContactDto.Item> getPageData(SyContactDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 고객문의 페이지 조회
        return syContactRepository.selectPageData(req);
    }

    /* 문의 등록 */
    @Transactional
    public SyContact create(SyContact body) {
        CmUtil.requireText(body.getContactTitle(), "문의 제목", 100, this);
        body.setContactId(CmUtil.generateId("sy_contact"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 고객문의 저장
        SyContact saved = syContactRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        syAttachService.applyChanges(body.getAttachFiles(), SyAttachRefTableConst.SY_CONTACT_CONTENT, saved.getContactId());
        syAttachService.applyChanges(body.getAttach2Files(), SyAttachRefTableConst.SY_CONTACT_ANSWER, saved.getContactId());
        saved.setAttachFiles(syAttachService.getAttachFilesByRef(SyAttachRefTableConst.SY_CONTACT_CONTENT, saved.getContactId()));
        saved.setAttach2Files(syAttachService.getAttachFilesByRef(SyAttachRefTableConst.SY_CONTACT_ANSWER, saved.getContactId()));
        em.flush();
        return saved;
    }



    /* 문의 수정 */
    @Transactional
    public SyContact update(String id, SyContact body) {
        CmUtil.requireId(id, "id", this);
        SyContact entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "contactId^regBy^regDate");
        CmUtil.requireText(entity.getContactTitle(), "문의 제목", 100, this);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 고객문의 저장
        SyContact saved = syContactRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        syAttachService.applyChanges(body.getAttachFiles(), SyAttachRefTableConst.SY_CONTACT_CONTENT, id);
        syAttachService.applyChanges(body.getAttach2Files(), SyAttachRefTableConst.SY_CONTACT_ANSWER, id);
        saved.setAttachFiles(syAttachService.getAttachFilesByRef(SyAttachRefTableConst.SY_CONTACT_CONTENT, id));
        saved.setAttach2Files(syAttachService.getAttachFilesByRef(SyAttachRefTableConst.SY_CONTACT_ANSWER, id));
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
        // [QueryDSL] 고객문의 선택적 필드 수정
        int affected = syContactRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 문의 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyContact entity = findById(id);
        // [쿼리 메서드] 고객문의 삭제
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
        rowStatus = entity.resolveRowStatus(entity.getContactId());

        if ("D".equals(rowStatus)) {
            if (entity.getContactId() == null)
                throw new CmBizException("삭제 대상 contactId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 고객문의 존재 여부 확인
            if (!syContactRepository.existsById(entity.getContactId()))
                throw new CmBizException("존재하지 않는 SyContact입니다: " + entity.getContactId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 고객문의 ID 기준 삭제
            syContactRepository.deleteById(entity.getContactId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setContactId(CmUtil.generateId("sy_contact"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 고객문의 저장
            SyContact saved = syContactRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getContactId() == null)
                throw new CmBizException("수정 대상 contactId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 고객문의 선택적 필드 수정
            int affected = syContactRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 SyContact입니다: " + entity.getContactId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
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
            // [쿼리 메서드] 고객문의 조건별 삭제
            syContactRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<SyContact> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (SyContact row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 고객문의 선택적 필드 수정
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
            // [쿼리 메서드] 고객문의 저장
            syContactRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
