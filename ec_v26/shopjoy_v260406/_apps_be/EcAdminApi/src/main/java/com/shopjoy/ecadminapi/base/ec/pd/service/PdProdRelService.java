package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdRelDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdRel;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdRelRepository;
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
public class PdProdRelService {

    private final PdProdRelRepository pdProdRelRepository;

    @PersistenceContext
    private EntityManager em;

    /* 연관 상품 키조회 */
    public PdProdRelDto.Item getById(String id) {
        // [QueryDSL] 상품 연관 관계 (연관상품/코디상품) 단건 조회
        PdProdRelDto.Item dto = pdProdRelRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdRelDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 상품 연관 관계 (연관상품/코디상품) 단건 조회
        return pdProdRelRepository.selectById(id).orElse(null);
    }

    /* 연관 상품 상세조회 */
    public PdProdRel findById(String id) {
        // [쿼리 메서드] 상품 연관 관계 (연관상품/코디상품) 단건 조회
        return pdProdRelRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdRel findByIdOrNull(String id) {
        // [쿼리 메서드] 상품 연관 관계 (연관상품/코디상품) 단건 조회
        return pdProdRelRepository.findById(id).orElse(null);
    }

    /* 연관 상품 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 상품 연관 관계 (연관상품/코디상품) 존재 여부 확인
        return pdProdRelRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 상품 연관 관계 (연관상품/코디상품) 존재 여부 확인
        if (!pdProdRelRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 연관 상품 목록조회 */
    public List<PdProdRelDto.Item> getList(PdProdRelDto.Request req) {
        // [QueryDSL] 상품 연관 관계 (연관상품/코디상품) 목록 조회
        return pdProdRelRepository.selectList(req);
    }

    /* 연관 상품 페이지조회 */
    public BasePage<PdProdRelDto.Item> getPageData(PdProdRelDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 상품 연관 관계 (연관상품/코디상품) 페이지 조회
        return pdProdRelRepository.selectPageData(req);
    }

    /* 연관 상품 등록 */
    @Transactional
    public PdProdRel create(PdProdRel body) {
        body.setProdRelId(CmUtil.generateId("pd_prod_rel"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 상품 연관 관계 (연관상품/코디상품) 저장
        PdProdRel saved = pdProdRelRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 연관 상품 수정 */
    @Transactional
    public PdProdRel update(String id, PdProdRel body) {
        CmUtil.requireId(id, "id", this);
        PdProdRel entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "prodRelId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 상품 연관 관계 (연관상품/코디상품) 저장
        PdProdRel saved = pdProdRelRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 연관 상품 수정 */
    @Transactional
    public PdProdRel updateSelective(PdProdRel entity) {
        if (entity.getProdRelId() == null) throw new CmBizException("prodRelId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getProdRelId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getProdRelId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 상품 연관 관계 (연관상품/코디상품) 선택적 필드 수정
        int affected = pdProdRelRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 연관 상품 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PdProdRel entity = findById(id);
        // [쿼리 메서드] 상품 연관 관계 (연관상품/코디상품) 삭제
        pdProdRelRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PdProdRel saveOneBase(PdProdRel entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getProdRelId());

        if ("D".equals(rowStatus)) {
            if (entity.getProdRelId() == null)
                throw new CmBizException("삭제 대상 prodRelId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 상품 연관 관계 (연관상품/코디상품) 존재 여부 확인
            if (!pdProdRelRepository.existsById(entity.getProdRelId()))
                throw new CmBizException("존재하지 않는 PdProdRel입니다: " + entity.getProdRelId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 상품 연관 관계 (연관상품/코디상품) ID 기준 삭제
            pdProdRelRepository.deleteById(entity.getProdRelId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setProdRelId(CmUtil.generateId("pd_prod_rel"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 상품 연관 관계 (연관상품/코디상품) 저장
            PdProdRel saved = pdProdRelRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getProdRelId() == null)
                throw new CmBizException("수정 대상 prodRelId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 상품 연관 관계 (연관상품/코디상품) 선택적 필드 수정
            int affected = pdProdRelRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PdProdRel입니다: " + entity.getProdRelId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getProdRelId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PdProdRel> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PdProdRel row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getProdRelId() == null || row.getProdRelId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PdProdRel::getProdRelId, "U", "prodRelId", this);
        CmUtil.requireRowIds(rows, PdProdRel::getProdRelId, "D", "prodRelId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PdProdRel::getProdRelId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 상품 연관 관계 (연관상품/코디상품) 조건별 삭제
            pdProdRelRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PdProdRel> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PdProdRel row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 상품 연관 관계 (연관상품/코디상품) 선택적 필드 수정
            int affected = pdProdRelRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getProdRelId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PdProdRel> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProdRel row : insertRows) {
            row.setProdRelId(CmUtil.generateId("pd_prod_rel"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 상품 연관 관계 (연관상품/코디상품) 저장
            pdProdRelRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
